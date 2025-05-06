import { Service } from "typedi";
import { Channel } from "amqplib";
import { OrderService } from "../../services/order.service";

@Service()
export class OrderSubscriber {
  constructor(private orderService: OrderService) {}

  async setupSubscriptions(channel: Channel) {
    // Assert exchanges and queues
    await channel.assertExchange("payment", "topic", { durable: true });
    await channel.assertQueue("order-service-queue", { durable: true });
    await channel.bindQueue(
      "order-service-queue",
      "payment",
      "payment.success"
    );
    await channel.bindQueue("order-service-queue", "payment", "payment.failed");

    // Consume messages
    await channel.consume("order-service-queue", async (msg) => {
      if (!msg) return;

      try {
        const paymentData = JSON.parse(msg.content.toString());
        console.log(
          "Received payment event:",
          msg.fields.routingKey,
          paymentData
        );

        if (msg.fields.routingKey === "payment.success") {
          await this.orderService.updatePaymentStatus(
            paymentData.orderId,
            "completed"
          );
        } else if (msg.fields.routingKey === "payment.failed") {
          await this.orderService.updatePaymentStatus(
            paymentData.orderId,
            "failed"
          );
        }

        channel.ack(msg);
      } catch (error) {
        console.error("Error processing payment event:", error);
        channel.nack(msg);
      }
    });
  }
}
