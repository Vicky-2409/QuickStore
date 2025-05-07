import "reflect-metadata";
import { config } from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { connect } from "amqplib";
import { Container } from "typedi";
import { useExpressServer } from "routing-controllers";
import { PaymentController } from "./controllers/payment.controller";
import { PaymentSubscriber } from "./events/subscribers/payment.subscriber";
import { PaymentService } from "./services/payment.service";
import { PaymentRepository } from "./repositories/payment.repository";

// Load environment variables first
config();

// Validate required environment variable
const requiredEnvVars = [
  "MONGO_URI",
  "RABBITMQ_URL",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error("Missing required environment variables:", missingEnvVars);
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Register dependencie
Container.set("paymentRepository", new PaymentRepository());

// Register PaymentService
Container.set(
  "paymentService",
  new PaymentService(
    Container.get("paymentRepository"),
    Container.get("rabbitChannel")
  )
);

// Setup routing-controller
useExpressServer(app, {
  controllers: [PaymentController],
  defaultErrorHandler: false,
});

// Connect to MongoDB
mongoose
  .connect("mongodb+srv://svignesh2409:GOgxz3UEBjCrSNtl@cluster0.hchjyx3.mongodb.net/quick-store-payment-service")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Connect to RabbitMQ and setup subscribers
async function setupRabbitMQ() {
  try {
    const connection = await connect(
      process.env.RABBITMQ_URL || "amqp://rabbitmq-service:5672"
    );
    const channel = await connection.createChannel();

    // Store RabbitMQ channel in container
    Container.set("rabbitChannel", channel);

    // Update PaymentService with the channel
    Container.set(
      "paymentService",
      new PaymentService(Container.get("paymentRepository"), channel)
    );

    // Setup subscribers
    const paymentSubscriber = Container.get(PaymentSubscriber);
    await paymentSubscriber.setupSubscriptions(channel);

    console.log("RabbitMQ connected and subscribers setup");
  } catch (error) {
    console.error("RabbitMQ connection error:", error);
  }
}

setupRabbitMQ();

// Start server
const PORT = process.env.PORT || 4004;
app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});
