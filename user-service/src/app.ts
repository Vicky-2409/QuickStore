import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { UserService } from "./services/user.service";
import { UserController } from "./controllers/user.controller";
import { createUserRoutes } from "./routes/user.routes";
import { RabbitMQConsumer } from "./rabbitmq/consumer";
import { authenticate } from "./middleware/auth.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { requestLogger } from "./middleware/logger.middleware";

// Load environment variables
dotenv.config();

export class App {
  private app: express.Application;
  private rabbitMQConsumer: RabbitMQConsumer;

  constructor() {
    this.app = express();
    this.rabbitMQConsumer = new RabbitMQConsumer(
      process.env.RABBITMQ_URL || "amqp://localhost",
      process.env.EXCHANGE_NAME || "user-registration",
      process.env.QUEUE_NAME || "user.created.queue"
    );
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(helmet());
    this.app.use(morgan("dev"));
    this.app.use(express.json());
    this.app.use(requestLogger);
  }

  private setupRoutes() {
    const userService = new UserService();
    const userController = new UserController(userService);
    const userRoutes = createUserRoutes(userController);

    // Apply authenticate middleware to all user routes
    this.app.use("/api/users", authenticate, userRoutes);
  }

  async start() {
    try {
      // Connect to MongoDB
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb+srv://svignesh2409:GOgxz3UEBjCrSNtl@cluster0.hchjyx3.mongodb.net/quick-store-user-service"
      );
      console.log("Connected to MongoDB");

      // Connect to RabbitMQ and start consuming messages
      await this.rabbitMQConsumer.connect();
      await this.rabbitMQConsumer.consume();
      console.log("RabbitMQ consumer started");

      // Start Express server
      const port = process.env.PORT || 4001;
      this.app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    } catch (error) {
      console.error("Failed to start application:", error);
      process.exit(1);
    }
  }

  async stop() {
    try {
      await mongoose.disconnect();
      await this.rabbitMQConsumer.close();
      console.log("Application stopped gracefully");
    } catch (error) {
      console.error("Error stopping application:", error);
    }
  }
}
