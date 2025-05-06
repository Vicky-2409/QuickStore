import * as amqp from "amqplib";
import { logger } from "../utils/logger";
import { DeliveryPartnerModel } from "../models/delivery-partner.model";
import { Order } from "../models/order.model";
import { Container } from "typedi";

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

export class RabbitMQConsumer {
  private connection: AmqpConnection | null = null;
  private channel: AmqpChannel | null = null;
  private socketService: any;

  constructor(
    private readonly url: string,
    private readonly exchangeName: string,
    private readonly queueName: string
  ) {
    logger.info(
      `Initializing RabbitMQ Consumer with URL: ${url}, Exchange: ${exchangeName}, Queue: ${queueName}`
    );
  }

  setSocketService(socketService: any) {
    this.socketService = socketService;
  }

  async connect() {
    try {
      logger.info("Attempting to connect to RabbitMQ...");
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
      await this.channel.assertExchange(this.exchangeName, "topic", {
        durable: true,
      });
      logger.info("Successfully asserted exchange");

      logger.info(`Asserting queue: ${this.queueName}`);
      await this.channel.assertQueue(this.queueName, { durable: true });
      logger.info("Successfully asserted queue");

      logger.info(
        `Binding queue to exchange with routing key: delivery_partner.registered`
      );
      await this.channel.bindQueue(
        this.queueName,
        this.exchangeName,
        "delivery_partner.registered"
      );

      logger.info(`Binding queue to exchange with routing key: order.created`);
      await this.channel.bindQueue(
        this.queueName,
        this.exchangeName,
        "order.created"
      );

      logger.info("Successfully bound queue to exchange");

      logger.info("RabbitMQ consumer connection established");
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
              logger.info("Received message:", content);

              if (msg.fields.routingKey === "delivery_partner.registered") {
                // Handle delivery partner registration
                const deliveryPartner = new DeliveryPartnerModel({
                  email: content.email,
                  available: false,
                });
                await deliveryPartner.save();
                logger.info(
                  `Created delivery partner record for ${content.email}`
                );
              } else if (msg.fields.routingKey === "order.created") {
                // Check if order already exists
                const existingOrder = await Order.findOne({
                  orderId: content.orderId,
                });
                if (existingOrder) {
                  logger.info(
                    `Order ${content.orderId} already exists, skipping...`
                  );
                  this.channel?.ack(msg);
                  return;
                }

                // Save order to database
                const order = new Order({
                  orderId: content.orderId,
                  customerEmail: content.customerEmail,
                  customerAddress: content.customerAddress,
                  status: "pending",
                  assignedPartnerId: null,
                });
                await order.save();
                logger.info(`Saved order ${content.orderId} to database`);

                // Handle new order
                if (this.socketService) {
                  await this.socketService.broadcastNewOrder(
                    content.orderId,
                    content.customerAddress
                  );
                  logger.info(
                    `Broadcasted new order ${content.orderId} to available partners`
                  );
                }
              }

              this.channel?.ack(msg);
            } catch (error) {
              logger.error("Error processing message:", error);
              this.channel?.nack(msg);
            }
          }
        },
        { noAck: false }
      );
      logger.info("Started consuming messages");
    } catch (error) {
      logger.error("Error starting consumer:", error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
        logger.info("Channel closed");
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
        logger.info("Connection closed");
      }
      logger.info("RabbitMQ consumer connection closed");
    } catch (error) {
      logger.error("Error closing RabbitMQ connection:", error);
      throw error;
    }
  }
}
