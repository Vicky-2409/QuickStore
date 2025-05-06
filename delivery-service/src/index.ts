import "reflect-metadata";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Container } from "typedi";
import morgan from "morgan";
import { Server } from "socket.io";
import { createServer } from "http";
import { Channel, Message } from "amqplib";
import { DeliveryController } from "./controllers/delivery.controller";
import { authenticateToken } from "./middleware/auth.middleware";
import { config } from "./config";
import { errorHandler } from "./middleware/error.middleware";
import { logger } from "./utils/logger";
import { setupSocketIO } from "./config/socket.io";
import { setupRabbitMQ, getRabbitMQChannel } from "./config/rabbitmq";
import { Order } from "./models/order.model";
import { DeliveryPartnerModel } from "./models/delivery-partner.model";
import { RabbitMQConsumer } from "./rabbitmq/consumer";
import { AuthServiceConsumer } from "./rabbitmq/auth.consumer";
import { SocketService } from "./socket/socket.service";
import { OrderService } from "./services/order.service";
import { DeliveryPartnerService } from "./services/delivery-partner.service";
import { OrderRepository } from "./repositories/order.repository";
import { DeliveryPartnerRepository } from "./repositories/delivery-partner.repository";
import { createDeliveryRoutes } from "./routes/delivery.routes";

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true,
};

app.use(morgan("dev"));
app.use(cors(corsOptions));
app.use(express.json());

// Initialize Socket.IO serve
const io = new Server(httpServer, {
  cors: corsOptions,
});

// Initialize services
const socketService = new SocketService(io);
const orderConsumer = new RabbitMQConsumer(
  process.env.RABBITMQ_URL || "amqp://localhost",
  "orders",
  "delivery-service-order-queue"
);
const authConsumer = new AuthServiceConsumer(
  process.env.RABBITMQ_URL || "amqp://localhost"
);

orderConsumer.setSocketService(socketService);
authConsumer.setSocketService(socketService);

// Initialize RabbitMQ connection
setupRabbitMQ()
  .then(() => {
    logger.info("RabbitMQ connection established");
  })
  .catch((error) => {
    logger.error("Failed to establish RabbitMQ connection:", error);
    process.exit(1);
  });

// MongoDB connection
const mongoUri =
  process.env.MONGODB_URI ||
  "mongodb+srv://svignesh2409:GOgxz3UEBjCrSNtl@cluster0.hchjyx3.mongodb.net/quick-store-delivery-service";
mongoose
  .connect(mongoUri)
  .then(async () => {
    logger.info("Connected to MongoDB");
    // Start consuming messages after MongoDB connection is established
    await orderConsumer.connect();
    await authConsumer.connect();
    await orderConsumer.startConsuming();
    await authConsumer.startConsuming();
  })
  .catch((error) => {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  });

// Register models in container first
Container.set("orderModel", Order);
Container.set("deliveryPartnerModel", DeliveryPartnerModel);

// Create repositories
const orderRepository = new OrderRepository();
const deliveryPartnerRepository = new DeliveryPartnerRepository(
  DeliveryPartnerModel
);

// Register repositories in container
Container.set("orderRepository", orderRepository);
Container.set("deliveryPartnerRepository", deliveryPartnerRepository);

// Create services
const orderService = new OrderService(orderRepository);
const deliveryPartnerService = new DeliveryPartnerService(
  deliveryPartnerRepository
);

// Register services in container
Container.set("orderService", orderService);
Container.set("deliveryPartnerService", deliveryPartnerService);

// Create controller and routes
const deliveryController = new DeliveryController(
  orderService,
  deliveryPartnerService
);
app.use("/api/delivery", createDeliveryRoutes(deliveryController));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, () => {
  logger.info(`Delivery Service running on port ${PORT}`);
});
