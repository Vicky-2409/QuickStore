import { Service } from "typedi";
import { Channel } from "amqplib";
import { PaymentService } from "../../services/payment.service";

@Service()
export class PaymentSubscriber {
  constructor(private paymentService: PaymentService) {}

  async setupSubscriptions(channel: Channel) {
    // Assert exchanges and queues
    await channel.assertExchange("order", "topic", { durable: true });
    await channel.assertQueue("payment-service-queue", { durable: true });
    await channel.bindQueue("payment-service-queue", "order", "order.created");

    // Consume messages
    await channel.consume("payment-service-queue", async (msg) => {
      if (!msg) return;

      try {
        const orderData = JSON.parse(msg.content.toString());
        console.log("Received order created event:", orderData);

        // Initiate payment for the order
        await this.paymentService.initiatePayment(
          orderData.orderId,
          orderData.amount,
          orderData.customerId,
          orderData.customerLocation,
          orderData.currency
        );

        channel.ack(msg);
      } catch (error) {
        console.error("Error processing order created event:", error);
        channel.nack(msg);
      }
    });
  }
}
