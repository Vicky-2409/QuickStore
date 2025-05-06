import amqp from "amqplib";
import { config } from "../config";
import { logger } from "../utils/logger";

export class OrderEventPublisher {
  private channel: amqp.Channel | null = null;

  constructor() {
    this.setupRabbitMQ();
  }

  private async setupRabbitMQ() {
    try {
      const connection = await amqp.connect(config.rabbitmq.url);
      this.channel = await connection.createChannel();

      // Declare the exchange
      await this.channel.assertExchange("order_events", "topic", {
        durable: true,
      });
      logger.info("Order events exchange asserted");
    } catch (error) {
      logger.error("Error setting up RabbitMQ for order events:", error);
      throw error;
    }
  }

  public async publishOrderCreated(orderData: {
    orderId: string;
    customerId: string;
    customerLocation: {
      lat: number;
      lng: number;
    };
  }) {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized");
    }

    try {
      await this.channel.publish(
        "order_events",
        "order.created",
        Buffer.from(
          JSON.stringify({
            type: "order_created",
            ...orderData,
          })
        )
      );
      logger.info(
        `Published order_created event for order ${orderData.orderId}`
      );
    } catch (error) {
      logger.error("Error publishing order_created event:", error);
      throw error;
    }
  }
}
