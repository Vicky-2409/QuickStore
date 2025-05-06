import amqp from "amqplib";
import { config } from "../config";
import { logger } from "../utils/logger";
import { Server } from "socket.io";
import { OrderService } from "../services/order.service";
import { OrderRepository } from "../repositories/order.repository";

let io: Server;

export const setupRabbitMQ = async (socketServer?: Server) => {
  if (socketServer) {
    io = socketServer;
  }

  try {
    const connection = await amqp.connect(config.rabbitmq.url);
    const channel = await connection.createChannel();

    // Declare exchanges
    await channel.assertExchange("order_events", "topic", { durable: true });
    await channel.assertExchange("delivery_events", "topic", { durable: true });

    // Declare queues
    await channel.assertQueue("new_orders", { durable: true });
    await channel.assertQueue("delivery_updates", { durable: true });
    await channel.assertQueue("order_updates", { durable: true });

    // Bind queues to exchanges
    await channel.bindQueue("new_orders", "order_events", "order.created");
    await channel.bindQueue("order_updates", "order_events", "order.updated");
    await channel.bindQueue(
      "delivery_updates",
      "delivery_events",
      "delivery.#"
    );

    const orderRepository = new OrderRepository();
    const orderService = new OrderService(orderRepository);
    if (io) {
      orderService.setSocketServer(io);
    }

    // Handle new orders
    channel.consume("new_orders", async (msg) => {
      if (msg) {
        try {
          const orderData = JSON.parse(msg.content.toString());
          logger.info(`Received new order: ${orderData.orderId}`);

          // Handle the new order
          await orderService.handleNewOrder(orderData);
          channel.ack(msg);
        } catch (error) {
          logger.error("Error processing new order:", error);
          channel.nack(msg);
        }
      }
    });

    // Handle order updates
    channel.consume("order_updates", async (msg) => {
      if (msg) {
        try {
          const updateData = JSON.parse(msg.content.toString());
          logger.info(`Received order update: ${updateData.orderId}`);

          // Handle order status update
          await orderService.updateOrderStatus(
            updateData.orderId,
            updateData.status,
            updateData.assignedPartnerId
          );
          channel.ack(msg);
        } catch (error) {
          logger.error("Error processing order update:", error);
          channel.nack(msg);
        }
      }
    });

    logger.info("RabbitMQ setup completed successfully");
    return channel;
  } catch (error) {
    logger.error("Error setting up RabbitMQ:", error);
    throw error;
  }
};

export const publishDeliveryEvent = async (
  channel: amqp.Channel,
  routingKey: string,
  data: any
) => {
  try {
    await channel.assertExchange("delivery_events", "topic", { durable: true });
    channel.publish(
      "delivery_events",
      routingKey,
      Buffer.from(JSON.stringify(data)),
      { persistent: true }
    );
    logger.info(`Published delivery event: ${routingKey}`, data);
  } catch (error) {
    logger.error("Error publishing delivery event:", error);
    throw error;
  }
};
