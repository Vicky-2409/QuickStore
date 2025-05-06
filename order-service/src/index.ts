import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Container } from "typedi";
import orderRoutes from "./routes/order.routes";
import { OrderRepository } from "./repositories/order.repository";
import { OrderService } from "./services/order.service";
import { IOrderService } from "./interfaces/services/order.service.interface";
import { OrderController } from "./controllers/order.controller";
import morgan from "morgan";
import { connectRabbitMQ } from "./config/rabbitmq";
import { Channel, Message } from "amqplib";
// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 4003;

// Middleware
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

// Validate required environment variables
const requiredEnvVars = ["PORT", "MONGODB_URI"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error("Missing required environment variables:", missingEnvVars);
  process.exit(1);
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

// Register dependencies
Container.set("orderRepository", new OrderRepository());
Container.set(
  "orderService",
  new OrderService(Container.get("orderRepository"))
);

// Get controller instance from containe
const orderController = Container.get(OrderController);

// Mount routes
app.use("/api/orders", orderRoutes(orderController));

// RabbitMQ setup
let channel: Channel;
connectRabbitMQ()
  .then((ch: Channel) => {
    channel = ch;
    console.log("RabbitMQ connected and subscribers setup");

    // Subscribe to payment success events
    channel
      .assertExchange("payment", "topic", { durable: true })
      .then(() => console.log("Payment exchange asserted"))
      .catch((err) => console.error("Error asserting payment exchange:", err));

    channel
      .assertQueue("order-service-payment-queue", { durable: true })
      .then(() => console.log("Order service payment queue asserted"))
      .catch((err) => console.error("Error asserting queue:", err));

    channel
      .bindQueue("order-service-payment-queue", "payment", "payment.success")
      .then(() => console.log("Queue bound to exchange"))
      .catch((err) => console.error("Error binding queue:", err));

    // Setup delivery events consumer
    channel
      .assertExchange("delivery_events", "topic", { durable: true })
      .then(() => console.log("Delivery events exchange asserted"))
      .catch((err) => console.error("Error asserting delivery exchange:", err));

    channel
      .assertQueue("order-service-delivery-queue", { durable: true })
      .then(() => console.log("Order service delivery queue asserted"))
      .catch((err) => console.error("Error asserting delivery queue:", err));

    channel
      .bindQueue(
        "order-service-delivery-queue",
        "delivery_events",
        "delivery.status_updated"
      )
      .then(() => console.log("Delivery queue bound to exchange"))
      .catch((err) => console.error("Error binding delivery queue:", err));

    // Consume payment success events
    channel.consume(
      "order-service-payment-queue",
      async (msg: Message | null) => {
        if (msg) {
          try {
            const data = JSON.parse(msg.content.toString());
            console.log("Received payment success event:", data);

            // Update order status
            const orderService = Container.get<IOrderService>("orderService");
            console.log("Updating payment status for order:", data.orderId);
            await orderService.updatePaymentStatus(data.orderId, "completed");
            console.log("Order payment status updated successfully");

            channel.ack(msg);
            console.log("Message acknowledged");
          } catch (error) {
            console.error("Error processing payment success event:", error);
            channel.nack(msg);
            console.log("Message negatively acknowledged");
          }
        }
      },
      { noAck: false }
    );

    // Consume delivery status update events
    channel.consume(
      "order-service-delivery-queue",
      async (msg: Message | null) => {
        if (msg) {
          try {
            const data = JSON.parse(msg.content.toString());
            console.log("Received delivery status update event:", data);

            // Update order status
            const orderService = Container.get<IOrderService>("orderService");
            console.log("Updating delivery status for order:", data.orderId);
            await orderService.updateOrderStatus(data.orderId, data.status);
            console.log("Order delivery status updated successfully");

            channel.ack(msg);
            console.log("Message acknowledged");
          } catch (error) {
            console.error(
              "Error processing delivery status update event:",
              error
            );
            channel.nack(msg);
            console.log("Message negatively acknowledged");
          }
        }
      },
      { noAck: false }
    );

    console.log("Consumer setup complete");
  })
  .catch((err: Error) => console.error("RabbitMQ connection error:", err));

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
);

// Start server
app.listen(port, () => {
  console.log(`Order service running on port ${port}`);
});
