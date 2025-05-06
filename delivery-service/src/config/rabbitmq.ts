import amqp from "amqplib";
import { logger } from "../utils/logger";
import { config } from "./index";

let channel: amqp.Channel;

export const setupRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(config.rabbitmq.url);
    channel = await connection.createChannel();
    logger.info("Connected to RabbitMQ");
  } catch (error) {
    logger.error("RabbitMQ connection error:", error);
    throw error;
  }
};

export const getRabbitMQChannel = () => {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized");
  }
  return channel;
};
