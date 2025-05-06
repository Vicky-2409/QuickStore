import * as amqp from "amqplib";
import { User } from "../models/user.model";

interface AmqpConnection {
  createChannel(): Promise<AmqpChannel>;
  close(): Promise<void>;
}

interface AmqpChannel {
  assertExchange(exchange: string, type: string, options: any): Promise<void>;
  assertQueue(queue: string, options: any): Promise<void>;
  bindQueue(queue: string, exchange: string, routingKey: string): Promise<void>;
  consume(
    queue: string,
    callback: (msg: AmqpMessage | null) => void
  ): Promise<void>;
  ack(message: AmqpMessage): void;
  nack(message: AmqpMessage): void;
  close(): Promise<void>;
}

interface AmqpMessage {
  content: Buffer;
}

export class RabbitMQConsumer {
  private connection: AmqpConnection | null = null;
  private channel: AmqpChannel | null = null;
  private maxRetries = 5;
  private retryDelay = 5000; // 5 seconds
  private isConnecting = false;

  constructor(
    private readonly url: string = "amqp://rabbitmq-service:5672",
    private readonly exchangeName: string = "user-registration",
    private readonly queueName: string = "profile.updated.queue"
  ) {
    console.log(
      `Initializing RabbitMQ Consumer with URL: ${url}, Exchange: ${exchangeName}, Queue: ${queueName}`
    );
  }

  private async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async connect(retryCount = 0): Promise<void> {
    // If already connected, return
    if (this.connection && this.channel) {
      return;
    }

    // If already trying to connect, wait
    if (this.isConnecting) {
      await this.wait(1000);
      return this.connect(retryCount);
    }

    this.isConnecting = true;
    try {
      console.log(
        `Attempting to connect to RabbitMQ (attempt ${retryCount + 1}/${
          this.maxRetries
        })...`
      );
      const conn = await amqp.connect(this.url);
      this.connection = conn as unknown as AmqpConnection;

      if (!this.connection) {
        throw new Error("Failed to establish RabbitMQ connection");
      }
      console.log("Successfully connected to RabbitMQ");

      console.log("Creating channel...");
      const ch = await this.connection.createChannel();
      this.channel = ch as unknown as AmqpChannel;

      if (!this.channel) {
        throw new Error("Failed to create RabbitMQ channel");
      }
      console.log("Successfully created channel");

      console.log(`Asserting exchange: ${this.exchangeName}`);
      await this.channel.assertExchange(this.exchangeName, "direct", {
        durable: true,
      });
      console.log("Successfully asserted exchange");

      console.log(`Asserting queue: ${this.queueName}`);
      await this.channel.assertQueue(this.queueName, { durable: true });
      console.log("Successfully asserted queue");

      console.log("Binding queue to routing key...");
      await this.channel.bindQueue(
        this.queueName,
        this.exchangeName,
        "profile.updated"
      );
      console.log("Successfully bound queue");

      console.log("Starting to consume messages...");
      await this.channel.consume(this.queueName, async (msg) => {
        if (msg) {
          try {
            const message = JSON.parse(msg.content.toString());
            await this.handleProfileUpdate(message);
            this.channel?.ack(msg);
          } catch (error) {
            console.error("Error processing message:", error);
            this.channel?.nack(msg);
          }
        }
      });
      console.log("RabbitMQ consumer started");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `Failed to connect to RabbitMQ (attempt ${retryCount + 1}/${
          this.maxRetries
        }):`,
        errorMessage
      );

      if (retryCount < this.maxRetries - 1) {
        console.log(`Retrying in ${this.retryDelay / 1000} seconds...`);
        await this.wait(this.retryDelay);
        return this.connect(retryCount + 1);
      }

      throw new Error(
        `Failed to connect to RabbitMQ after ${this.maxRetries} attempts: ${errorMessage}`
      );
    } finally {
      this.isConnecting = false;
    }
  }

  async handleProfileUpdate(message: any) {
    try {
      const { userId, email, name, phone } = message;

      // Update user profile in auth service
      await User.findOneAndUpdate(
        { email },
        {
          $set: {
            name,
            phone: phone || undefined,
          },
        },
        { new: true }
      );

      console.log(`Successfully updated profile for user ${email}`);
    } catch (error) {
      console.error("Error handling profile update:", error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
        console.log("Channel closed");
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
        console.log("Connection closed");
      }
      console.log("RabbitMQ connection closed");
    } catch (error) {
      console.error("Error closing RabbitMQ connection:", error);
      throw error;
    }
  }
}
