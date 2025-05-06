import * as amqp from "amqplib";

interface AmqpConnection {
  createChannel(): Promise<AmqpChannel>;
  close(): Promise<void>;
}

interface AmqpChannel {
  assertExchange(exchange: string, type: string, options: any): Promise<void>;
  publish(
    exchange: string,
    routingKey: string,
    content: Buffer,
    options: any
  ): boolean;
  close(): Promise<void>;
}

export class RabbitMQProducer {
  private connection: AmqpConnection | null = null;
  private channel: AmqpChannel | null = null;
  private maxRetries = 5;
  private retryDelay = 5000; // 5 seconds
  private isConnecting = false;

  constructor(
    private readonly url: string = "amqp://rabbitmq-service:5672",
    private readonly exchangeName: string = "user-registration"
  ) {
    console.log(
      `Initializing RabbitMQ Producer with URL: ${url} and Exchange: ${exchangeName}`
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

      console.log("RabbitMQ producer connection established");
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

  async publishProfileUpdate(
    userId: string,
    email: string,
    name: string,
    phone?: string
  ) {
    if (!this.channel) {
      try {
        await this.connect();
      } catch (error) {
        console.error(
          "Failed to establish RabbitMQ connection for publishing:",
          error
        );
        return; // Silently fail - we don't want to block profile updates if RabbitMQ is down
      }
    }

    const message = {
      userId,
      email,
      name,
      phone,
      timestamp: new Date().toISOString(),
    };

    const routingKey = "profile.updated";
    console.log(`Publishing profile update with routing key: ${routingKey}`);
    console.log("Message content:", message);

    try {
      if (!this.channel) {
        throw new Error("Channel not initialized after connection attempt");
      }

      const success = this.channel.publish(
        this.exchangeName,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      if (success) {
        console.log(`Successfully published profile update event for ${email}`);
      } else {
        console.error(`Failed to publish profile update for ${email}`);
      }
    } catch (error) {
      console.error("Failed to publish profile update:", error);
      // Don't throw the error - we don't want to block profile updates if RabbitMQ is down
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
      console.log("RabbitMQ producer connection closed");
    } catch (error) {
      console.error("Error closing RabbitMQ connection:", error);
      throw error;
    }
  }
}
