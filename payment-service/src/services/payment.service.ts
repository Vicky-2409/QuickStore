import { Service, Inject } from "typedi";
import Razorpay from "razorpay";
import { PaymentRepository } from "../repositories/payment.repository";
import { Channel } from "amqplib";
import crypto from "crypto";
import axios from "axios";
import dotenv from "dotenv";
import { IPayment } from "../models/payment.model";

dotenv.config();

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "bhtVpaw0zDw5uCY9ybVGEYRE";
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || "https://thestore.pw";

if (!RAZORPAY_KEY_SECRET) {
  throw new Error("RAZORPAY_KEY_SECRET is not configured in your .env file");
}

@Service()
export class PaymentService {
  private razorpay: Razorpay;
  private readonly RAZORPAY_KEY_SECRET: string = RAZORPAY_KEY_SECRET as string;
  private readonly API_GATEWAY_URL: string = API_GATEWAY_URL;

  constructor(
    @Inject("paymentRepository") private paymentRepository: PaymentRepository,
    @Inject("rabbitChannel") private channel: Channel
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_Wsp2NzIUWHF2Cm",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "bhtVpaw0zDw5uCY9ybVGEYRE",
    });
  }

  async initiatePayment(
    orderId: string,
    amount: number,
    customerEmail: string,
    customerAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    },
    currency: string = "INR"
  ) {
    try {
      console.log(`Initiating payment for order ${orderId} with amount ${amount} ${currency}`);
      
      // The frontend already multiplies by 100 in the createPayment method
      // So we should NOT multiply by 100 again here to avoid double conversion
      const amountInPaise = amount;
      
      // Create Razorpay order
      const razorpayOrder = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency,
        receipt: orderId,
      });

      console.log("Razorpay order created:", razorpayOrder);

      // Create payment record with the same Razorpay order ID
      const payment = await this.paymentRepository.create({
        orderId,
        amount,
        currency,
        status: "pending",
        razorpayOrderId: razorpayOrder.id,
        customerEmail,
        customerAddress,
      });

      console.log("Payment record created:", {
        paymentId: payment._id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      });

      return {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        razorpayOrderId: razorpayOrder.id,
      };
    } catch (error) {
      console.error("Error initiating payment:", error);
      throw new Error("Failed to initiate payment");
    }
  }

  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    try {
      console.log("Verifying payment for Razorpay order:", razorpayOrderId);
      console.log("Payment ID:", razorpayPaymentId);
      console.log("Signature:", razorpaySignature);
      
      // First get the payment by razorpay order id to get the orderId
      console.log("Finding payment record by Razorpay order ID:", razorpayOrderId);
      const paymentByRazorpay =
        await this.paymentRepository.findByRazorpayOrderId(razorpayOrderId);
      
      if (!paymentByRazorpay) {
        console.error("Payment record not found by Razorpay order ID:", razorpayOrderId);
        throw new Error("Payment not found by Razorpay order ID");
      }
      
      console.log("Found payment record:", paymentByRazorpay);

      // Then get the complete payment record with customer information
      console.log("Finding payment by order ID:", paymentByRazorpay.orderId);
      const payment = await this.paymentRepository.findByOrderId(
        paymentByRazorpay.orderId
      );
      
      if (!payment) {
        console.error("Payment record not found by order ID:", paymentByRazorpay.orderId);
        throw new Error("Payment not found by order ID");
      }
      
      console.log("Found complete payment record:", payment);

      // Generate signature using Razorpay order ID and payment ID
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac("sha256", this.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      console.log("Signature verification:", {
        received: razorpaySignature,
        expected: expectedSignature,
        body,
        secret: this.RAZORPAY_KEY_SECRET,
      });

      if (expectedSignature !== razorpaySignature) {
        throw new Error("Invalid payment signature");
      }

      // Update payment status
      const updatedPayment = await this.paymentRepository.updateStatus(
        payment.orderId,
        "completed",
        { paymentId: razorpayPaymentId, signature: razorpaySignature }
      );

      console.log("Payment status updated, preparing to publish event...");

      try {
        // Ensure exchanges exist before publishing
        console.log("Asserting exchanges...");
        await this.channel.assertExchange("payment", "topic", {
          durable: true,
        });
        await this.channel.assertExchange("orders", "topic", {
          durable: true,
        });
        console.log("Exchanges asserted successfully");

        // Publish payment success event for order service
        const paymentMessage = {
          orderId: payment.orderId,
          paymentId: payment._id,
          amount: payment.amount,
          status: "completed",
        };

        console.log("Publishing payment success event:", paymentMessage);
        await this.channel.publish(
          "payment",
          "payment.success",
          Buffer.from(JSON.stringify(paymentMessage))
        );

        // Publish order_created event for delivery service
        const orderMessage = {
          orderId: payment.orderId,
          customerEmail: payment.customerEmail,
          customerAddress: payment.customerAddress,
          amount: payment.amount,
          status: "pending",
        };

        console.log("Publishing order_created event:", orderMessage);
        await this.channel.publish(
          "orders",
          "order.created",
          Buffer.from(JSON.stringify(orderMessage))
        );

        console.log("Events published successfully");
      } catch (error) {
        console.error("Error publishing events:", error);
        throw error;
      }

      return updatedPayment;
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw new Error("Payment verification failed");
    }
  }

  async getPaymentStatus(orderId: string) {
    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) {
      throw new Error("Payment not found");
    }
    return payment;
  }

  generateSignature(orderId: string, paymentId: string): string {
    const body = orderId + "|" + paymentId;
    console.log("Generating signature for:", {
      body,
      secret: this.RAZORPAY_KEY_SECRET,
    });
    return crypto
      .createHmac("sha256", this.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");
  }

  async findByOrderId(orderId: string): Promise<IPayment | null> {
    return this.paymentRepository.findByOrderId(orderId);
  }

  async findByRazorpayOrderId(
    razorpayOrderId: string
  ): Promise<IPayment | null> {
    return this.paymentRepository.findByRazorpayOrderId(razorpayOrderId);
  }

  async updatePaymentStatus(
    paymentId: string,
    status: "completed" | "failed",
    razorpayPaymentId: string
  ): Promise<IPayment | null> {
    return await this.paymentRepository.updateStatus(paymentId, status, {
      paymentId: razorpayPaymentId,
    });
  }
}
