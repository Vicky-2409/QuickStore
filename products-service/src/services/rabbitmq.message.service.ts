import * as amqp from "amqplib";
import { IMessageService } from "../interfaces/services/message.service.interface";
import { AppError } from "../utils/error-handler";

export class RabbitMQMessageService implements IMessageService {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  // Establish connection to RabbitMQ
  async connect(): Promise<void> {
    try {
      // Connecting to RabbitMQ server
      const conn = await amqp.connect(
        process.env.RABBITMQ_URL || "amqp://rabbitmq-service:5672"
      );
      this.connection = conn as unknown as amqp.Connection;
      this.channel = await conn.createChannel();
      console.log("Connected to RabbitMQ");
    } catch (error) {
      throw new AppError("Failed to connect to RabbitMQ", 500);
    }
  }

  // Consume messages from a queue
  async consumeMessages(
    queue: string,
    callback: (message: any) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new AppError("RabbitMQ channel not initialized", 500);
    }

    try {
      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.consume(queue, async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            await callback(content);
            this.channel?.ack(msg); // Acknowledge that the message was processed
          } catch (error) {
            console.error("Error processing message:", error);
            this.channel?.nack(msg); // Negative acknowledgment if processing fails
          }
        }
      });
    } catch (error) {
      throw new AppError("Failed to consume messages", 500);
    }
  }

  // Publish a message to a specific exchange
  async publishMessage(exchange: string, message: any): Promise<void> {
    if (!this.channel) {
      throw new AppError("RabbitMQ channel not initialized", 500);
    }

    try {
      await this.channel.assertExchange(exchange, "fanout", { durable: false });
      await this.channel.publish(
        exchange,
        "", // Since it's a fanout exchange, no routing key is needed
        Buffer.from(JSON.stringify(message))
      );
    } catch (error) {
      throw new AppError("Failed to publish message", 500);
    }
  }

  // Close the connection and channel
  async close(): Promise<void> {
    if (this.channel) {
      try {
        await this.channel.close(); // Close the channel first
        console.log("RabbitMQ channel closed");
      } catch (error) {
        console.error("Error while closing RabbitMQ channel:", error);
      }
    }

    if (this.connection) {
      try {
        // Close the connection using the correct method
        await (this.connection as any).close();
        console.log("RabbitMQ connection closed");
      } catch (error) {
        console.error("Error while closing RabbitMQ connection:", error);
      }
    }
  }
}
