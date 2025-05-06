import { Server } from "socket.io";
import { DeliveryPartnerModel } from "../models/delivery-partner.model";
import { logger } from "../utils/logger";

export class SocketService {
  private io: Server;

  constructor(server: Server) {
    this.io = server;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      logger.info(`New socket connection: ${socket.id}`);

      // Handle delivery partner connection
      socket.on(
        "delivery_partner_connected",
        async (data: { email: string; socketId: string }) => {
          try {
            await DeliveryPartnerModel.findOneAndUpdate(
              { email: data.email },
              {
                socketId: data.socketId,
                available: true,
                lastSeen: new Date(),
              },
              { upsert: true }
            );
            logger.info(`Delivery partner connected: ${data.email}`);
          } catch (error) {
            logger.error(`Error updating delivery partner status: ${error}`);
          }
        }
      );

      // Handle order acceptance
      socket.on(
        "accept_order",
        async (data: { orderId: string; partnerId: string }) => {
          try {
            await DeliveryPartnerModel.findOneAndUpdate(
              { email: data.partnerId },
              { available: false }
            );
            // Broadcast to other delivery partners that the order is taken
            socket.broadcast.emit("order_taken", { orderId: data.orderId });
            logger.info(`Order ${data.orderId} accepted by ${data.partnerId}`);
          } catch (error) {
            logger.error(`Error handling order acceptance: ${error}`);
          }
        }
      );

      // Handle order status updates
      socket.on(
        "update_order_status",
        (data: { orderId: string; status: string }) => {
          logger.info(`Order ${data.orderId} status updated to ${data.status}`);
          // Broadcast to all connected clients
          this.io.emit("order_status_updated", data);
        }
      );

      socket.on("disconnect", async () => {
        try {
          await DeliveryPartnerModel.findOneAndUpdate(
            { socketId: socket.id },
            {
              socketId: null,
              available: false,
              lastSeen: new Date(),
            }
          );
          logger.info(`Socket disconnected: ${socket.id}`);
        } catch (error) {
          logger.error(`Error handling socket disconnect: ${error}`);
        }
      });
    });
  }

  async broadcastNewOrder(order: any) {
    try {
      const availablePartners = await DeliveryPartnerModel.find({
        available: true,
        socketId: { $ne: null },
      });

      if (availablePartners.length > 0) {
        this.io.emit("new_order", order);
        logger.info(
          `Broadcasted new order to ${availablePartners.length} delivery partners`
        );
      } else {
        logger.info("No available delivery partners to broadcast order to");
      }
    } catch (error) {
      logger.error(`Error broadcasting new order: ${error}`);
    }
  }
}
