import * as amqp from "amqplib";
import dotenv from "dotenv";
import { consumeAuthEvents } from "../consumers/auth.consumer";

dotenv.config();

export const connectToRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(
      process.env.RABBITMQ_URL || "amqp://localhost"
    );
    const channel = await connection.createChannel();

    // Declare the exchange
    const exchange = "auth_events";
    await channel.assertExchange(exchange, "fanout", { durable: false });

    // Declare the queue
    const queue = process.env.RABBITMQ_QUEUE || "auth_events";
    await channel.assertQueue(queue, { durable: true });

    // Bind the queue to the exchange
    await channel.bindQueue(queue, exchange, "");

    // Set up consumer
    await channel.consume(queue, (msg: amqp.ConsumeMessage | null) => {
      if (msg) {
        consumeAuthEvents(JSON.parse(msg.content.toString()));
        channel.ack(msg);
      }
    });

    console.log("Connected to RabbitMQ and listening for auth events");
    return { connection, channel };
  } catch (error) {
    console.error("Failed to connect to RabbitMQ:", error);
    throw error;
  }
};
