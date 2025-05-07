import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { User } from "./models/user.model";
import { UserRepository } from "./repositories/user.repository";
import { AuthService } from "./services/auth.service";
import { AuthController } from "./controllers/auth.controller";
import { createAuthRoutes } from "./routes/auth.routes";
import { seedAdmin } from "./utils/seed.utils";
import morgan from "morgan";
import { RabbitMQConsumer } from "./rabbitmq/consumer";

// Load environment variabless
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// RabbitMQ Configuration
const rabbitMQUrl = process.env.RABBITMQ_URL || "amqp://rabbitmq-service:5672";
const exchangeName = process.env.EXCHANGE_NAME || "user-registration";

// Middleware
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

// Database connection
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "";
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB");
    // Run seed script after successful connection
    seedAdmin();
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit process with failure
  }
};

// Initialize repositories
const userRepository = new UserRepository(User);

// Initialize services
const authService = new AuthService(userRepository, rabbitMQUrl);

// Initialize RabbitMQ Consumer
const rabbitMQConsumer = new RabbitMQConsumer(rabbitMQUrl, exchangeName);

// Initialize controller
const authController = new AuthController(authService);

// Routes
app.use("/api/auth", createAuthRoutes(authController));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
  }
);

// Start server only after MongoDB and RabbitMQ connections are established
const startServer = async () => {
  try {
    await connectDB();

    // Ensure RabbitMQ connections are established
    await authService.userServiceProducer.connect();
    await authService.deliveryServiceProducer.connect();
    console.log("RabbitMQ producer connections established");

    await rabbitMQConsumer.connect();
    console.log("RabbitMQ consumer connection established");

    app.listen(port, () => {
      console.log(`Auth service running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
