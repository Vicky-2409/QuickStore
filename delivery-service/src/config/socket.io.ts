import { Server } from "socket.io";
import { createServer } from "http";
import { Express } from "express";
import { logger } from "../utils/logger";

export const setupSocketIO = (app: Express) => {
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return httpServer;
};
