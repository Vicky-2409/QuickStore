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

// Print available environment variables for debugging
console.log("Environment Variables Available:");
console.log("MONGO_URI:", process.env.MONGO_URI ? "Set" : "Not Set");
console.log("RABBITMQ_URL:", process.env.RABBITMQ_URL ? "Set" : "Not Set");
console.log(
  "RAZORPAY_KEY_ID:",
  process.env.RAZORPAY_KEY_ID ? "Set" : "Not Set"
);
console.log(
  "RAZORPAY_KEY_SECRET:",
  process.env.RAZORPAY_KEY_SECRET ? "Set" : "Not Set"
);

// Use fallback values for missing environment variables in production
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://svignesh2409:GOgxz3UEBjCrSNtl@cluster0.hchjyx3.mongodb.net/quick-store-payment-service";
// Try different RabbitMQ URLs if connection fails
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://rabbitmq-service:5672";
const RAZORPAY_KEY_ID =
  process.env.RAZORPAY_KEY_ID || "rzp_test_Wsp2NzIUWHF2Cm";
const RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET || "bhtVpaw0zDw5uCY9ybVGEYRE";

// Create express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create repository instance and register it
const paymentRepository = new PaymentRepository();
Container.set("paymentRepository", paymentRepository);
console.log("Payment repository registered in container");

// Connect to MongoDB first
console.log("Connecting to MongoDB...");
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Setup RabbitMQ and initialize services before setting up controllers
async function setupServices() {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(
        `Attempt ${retries + 1} to connect to RabbitMQ at ${RABBITMQ_URL}...`
      );

      // Add a delay to give RabbitMQ time to fully initialize
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      // Connect to RabbitMQ
      const connection = await connect(RABBITMQ_URL);
      console.log("RabbitMQ connection established");

      // Create channel
      const channel = await connection.createChannel();
      console.log("RabbitMQ channel created");

      // Set the channel in the DI container
      Container.set("rabbitChannel", channel);
      console.log("RabbitMQ channel registered in container");

      // Create PaymentService with repository and channel
      console.log("Creating payment service instance...");
      const paymentService = Container.get(PaymentService);

      // Register the service in the container
      Container.set("paymentService", paymentService);
      console.log("Payment service registered in container");

      // Create and setup subscribers
      console.log("Setting up payment subscriber...");
      const paymentSubscriber = new PaymentSubscriber(paymentService);
      await paymentSubscriber.setupSubscriptions(channel);
      console.log("Payment subscriber setup complete");

      console.log("All services initialized successfully");
      return true; // Success
    } catch (error) {
      console.error(
        `Service initialization attempt ${retries + 1} failed:`,
        error
      );
      retries++;

      if (retries >= maxRetries) {
        console.error("Max retries reached. Unable to initialize services.");
        return false;
      }
    }
  }
  return false;
}

// Start application
(async () => {
  try {
    // Initialize services first
    const servicesInitialized = await setupServices();

    if (!servicesInitialized) {
      console.error("Failed to initialize required services");
      process.exit(1);
    }

    // Setup controllers AFTER services are initialized
    console.log("Setting up controllers...");
    useExpressServer(app, {
      controllers: [PaymentController],
      defaultErrorHandler: false,
    });
    console.log("Controllers setup complete");

    // Start server
    const PORT = process.env.PORT || 4004;
    app.listen(PORT, () => {
      console.log(`Payment Service running on port ${PORT}`);
      console.log("In the PaymentController, I changed how we get the payment service instance. Instead of using constructor injection with @Inject, we now use Container.get('paymentService') directly in the constructor.");
    });
  } catch (error) {
    console.error("Failed to start payment service:", error);
    process.exit(1);
  }
})();
