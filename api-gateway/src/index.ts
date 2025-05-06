import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { createProxyRoutes } from "./routes/proxy.routes";
import { requestLogger } from "./middlewares/logger";
import { AppError } from "./utils/appError";

// Load environment variables
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });
dotenv.config();
// Validate required environment variables
const requiredEnvVars = [
  "PORT",
  "AUTH_SERVICE_URL",
  "USER_SERVICE_URL",
  "PRODUCT_SERVICE_URL",
  "ORDER_SERVICE_URL",
  "PAYMENT_SERVICE_URL",
  "DELIVERY_SERVICE_URL",
  "FRONTEND_URL",
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT;

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io",
});

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "frontend-srv",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-User-Email",
      "X-User-Id",
      "X-User-Role",
      "x-user-email",
      "x-partner-email",
    ],
  })
);
app.use(requestLogger);

// Routes
app.use("/", createProxyRoutes());

// Socket.IO connection handling
io.on("connection", (socket: Socket) => {
  console.log(
    `[${new Date().toISOString()}] New socket connection: ${socket.id}`
  );

  // Forward delivery partner connection events
  socket.on(
    "delivery_partner_connected",
    (data: { email: string; socketId: string }) => {
      console.log(
        `[${new Date().toISOString()}] Delivery partner connected:`,
        data
      );
      // Forward to delivery service
      io.emit("delivery_partner_connected", data);
    }
  );

  // Forward order acceptance events
  socket.on("accept_order", (data: { orderId: string; partnerId: string }) => {
    console.log(`[${new Date().toISOString()}] Order accepted:`, data);
    // Forward to delivery service
    io.emit("accept_order", data);
  });

  // Forward order status updates
  socket.on(
    "update_order_status",
    (data: { orderId: string; status: string }) => {
      console.log(`[${new Date().toISOString()}] Order status updated:`, data);
      // Forward to all connected clients
      io.emit("order_status_updated", data);
    }
  );

  socket.on("disconnect", () => {
    console.log(
      `[${new Date().toISOString()}] Socket disconnected: ${socket.id}`
    );
  });
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(`[${new Date().toISOString()}] Error: ${err.message}`);

    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
);

// Start server
httpServer.listen(port, () => {
  console.log(
    `[${new Date().toISOString()}] API Gateway running on port ${port}`
  );
  console.log(`[${new Date().toISOString()}] Service URLs:`, {
    auth: process.env.AUTH_SERVICE_URL,
    user: process.env.USER_SERVICE_URL,
    product: process.env.PRODUCT_SERVICE_URL,
    order: process.env.ORDER_SERVICE_URL,
    payment: process.env.PAYMENT_SERVICE_URL,
    delivery: process.env.DELIVERY_SERVICE_URL,
  });
});
