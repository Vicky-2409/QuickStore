import * as amqp from "amqplib";
import { logger } from "../utils/logger";
import { DeliveryPartnerModel } from "../models/delivery-partner.model";
import { Container } from "typedi";
import { SocketService } from "../socket/socket.service";

interface AmqpConnection {
  createChannel(): Promise<AmqpChannel>;
  close(): Promise<void>;
}

interface AmqpChannel {
  assertExchange(exchange: string, type: string, options: any): Promise<void>;
  assertQueue(queue: string, options: any): Promise<{ queue: string }>;
  bindQueue(queue: string, exchange: string, routingKey: string): Promise<void>;
  consume(
    queue: string,
    callback: (msg: amqp.Message | null) => void,
    options: any
  ): Promise<void>;
  ack(msg: amqp.Message): void;
  nack(msg: amqp.Message): void;
  close(): Promise<void>;
}

export class AuthServiceConsumer {
  private connection: AmqpConnection | null = null;
  private channel: AmqpChannel | null = null;
  private socketService: SocketService | null = null;

  constructor(
    private readonly url: string,
    private readonly exchangeName: string = "auth",
    private readonly queueName: string = "delivery-service-auth-queue"
  ) {
    logger.info(
      `Initializing Auth Service Consumer with URL: ${url}, Exchange: ${exchangeName}, Queue: ${queueName}`
    );
  }

  setSocketService(socketService: SocketService) {
    this.socketService = socketService;
  }

  async connect() {
    try {
      logger.info("Attempting to connect to RabbitMQ for auth events...");
      const conn = await amqp.connect(this.url);
      this.connection = conn as unknown as AmqpConnection;

      if (!this.connection) {
        throw new Error("Failed to establish RabbitMQ connection");
      }
      logger.info("Successfully connected to RabbitMQ");

      logger.info("Creating channel...");
      const ch = await this.connection.createChannel();
      this.channel = ch as unknown as AmqpChannel;

      if (!this.channel) {
        throw new Error("Failed to create RabbitMQ channel");
      }
      logger.info("Successfully created channel");

      logger.info(`Asserting exchange: ${this.exchangeName}`);
      await this.channel.assertExchange(this.exchangeName, "direct", {
        durable: true,
      });
      logger.info("Successfully asserted exchange");

      logger.info(`Asserting queue: ${this.queueName}`);
      await this.channel.assertQueue(this.queueName, { durable: true });
      logger.info("Successfully asserted queue");

      // Bind to delivery partner registration events
      logger.info(
        `Binding queue to exchange with routing key: delivery_partner.registered`
      );
      await this.channel.bindQueue(
        this.queueName,
        this.exchangeName,
        "delivery_partner.registered"
      );

      logger.info("Successfully bound queue to exchange");

      // Start consuming messages
      await this.startConsuming();
      logger.info("Auth Service Consumer connection established");
    } catch (error) {
      logger.error("Failed to connect to RabbitMQ:", error);
      throw error;
    }
  }

  async startConsuming() {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }

    try {
      await this.channel.consume(
        this.queueName,
        async (msg: amqp.Message | null) => {
          if (msg) {
            try {
              const content = JSON.parse(msg.content.toString());
              logger.info("Received auth service message:", content);

              if (msg.fields.routingKey === "delivery_partner.registered") {
                // Handle delivery partner registration
                const deliveryPartner = new DeliveryPartnerModel({
                  email: content.email,
                  name: content.name,
                  phone: content.phone,
                  available: false,
                  currentLocation: null,
                  isVerified: content.isVerified,
                });
                await deliveryPartner.save();
                logger.info(
                  `Created delivery partner record for ${content.email}`
                );
              }

              this.channel?.ack(msg);
            } catch (error) {
              logger.error("Error processing auth service message:", error);
              this.channel?.nack(msg);
            }
          }
        },
        { noAck: false }
      );
      logger.info("Started consuming auth service messages");
    } catch (error) {
      logger.error("Error starting auth service consumer:", error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
        logger.info("Auth service channel closed");
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
        logger.info("Auth service connection closed");
      }
      logger.info("Auth Service Consumer connection closed");
    } catch (error) {
      logger.error("Error closing Auth Service Consumer connection:", error);
      throw error;
    }
  }
}
