import dotenv from "dotenv";
import path from "path";
import { App } from "./app";

// Load environment variabless
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

// Create and start the application
const app = new App();
app.start().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("Received SIGINT. Shutting down gracefully...");
  await app.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM. Shutting down gracefully...");
  await app.stop();
  process.exit(0);
});
