import * as amqp from "amqplib";
import { UserRole, VehicleType } from "../enums/user.enum";

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

export class UserServiceProducer {
  private connection: AmqpConnection | null = null;
  private channel: AmqpChannel | null = null;

  constructor(
    private readonly url: string,
    private readonly exchangeName: string = "user-registration"
  ) {
    console.log(
      `Initializing User Service RabbitMQ Producer with URL: ${url} and Exchange: ${exchangeName}`
    );
  }

  async connect() {
    try {
      console.log("Attempting to connect to RabbitMQ for User Service...");
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

      console.log("User Service RabbitMQ producer connection established");
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      throw error;
    }
  }

  async publishUserRegistration(
    userId: string,
    email: string,
    role: UserRole,
    name: string,
    phone: string | undefined,
    password: string,
    vehicleType?: VehicleType,
    vehicleNumber?: string
  ) {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }

    const message = {
      userId,
      email,
      role,
      name,
      phone,
      password,
      vehicleType,
      vehicleNumber,
      timestamp: new Date().toISOString(),
    };

    console.log(`Publishing user registration event to User Service`);
    console.log("Message content:", message);

    try {
      const success = this.channel.publish(
        this.exchangeName,
        "profile.updated",
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      if (success) {
        console.log(
          `Successfully published user registration event to User Service for ${email}`
        );
      } else {
        console.error(`Failed to publish message to User Service for ${email}`);
      }
    } catch (error) {
      console.error("Failed to publish message:", error);
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
      console.log("User Service RabbitMQ producer connection closed");
    } catch (error) {
      console.error("Error closing RabbitMQ connection:", error);
      throw error;
    }
  }
}

export class DeliveryServiceProducer {
  private connection: AmqpConnection | null = null;
  private channel: AmqpChannel | null = null;

  constructor(
    private readonly url: string,
    private readonly exchangeName: string = "auth"
  ) {
    console.log(
      `Initializing Delivery Service RabbitMQ Producer with URL: ${url} and Exchange: ${exchangeName}`
    );
  }

  async connect() {
    try {
      console.log("Attempting to connect to RabbitMQ for Delivery Service...");
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

      console.log("Delivery Service RabbitMQ producer connection established");
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      throw error;
    }
  }

  async publishDeliveryPartnerRegistration(
    email: string,
    name: string,
    phone: string | undefined,
    vehicleType: VehicleType,
    vehicleNumber: string
  ) {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }

    const message = {
      email,
      name,
      phone,
      vehicleType,
      vehicleNumber,
      timestamp: new Date().toISOString(),
    };

    console.log(
      `Publishing delivery partner registration event to Delivery Service`
    );
    console.log("Message content:", message);

    try {
      const success = this.channel.publish(
        this.exchangeName,
        "delivery_partner.registered",
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      if (success) {
        console.log(
          `Successfully published delivery partner registration event to Delivery Service for ${email}`
        );
      } else {
        console.error(
          `Failed to publish message to Delivery Service for ${email}`
        );
      }
    } catch (error) {
      console.error("Failed to publish message:", error);
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
      console.log("Delivery Service RabbitMQ producer connection closed");
    } catch (error) {
      console.error("Error closing RabbitMQ connection:", error);
      throw error;
    }
  }
}
