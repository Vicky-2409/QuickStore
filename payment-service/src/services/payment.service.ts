import { Service, Inject } from "typedi";
import Razorpay from "razorpay";
import { PaymentRepository } from "../repositories/payment.repository";
import { Channel } from "amqplib";
import crypto from "crypto";
import axios from "axios";
import dotenv from "dotenv";
import { IPayment } from "../models/payment.model";

dotenv.config();

const RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET || "bhtVpaw0zDw5uCY9ybVGEYRE";
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
      console.log("=== Payment Initiation Started ===");
      console.log("Input parameters:", {
        orderId,
        amount,
        currency,
        customerEmail,
        customerAddress,
      });

      // Convert amount to paise (multiply by 100)
      const amountInPaise = amount;
      console.log("Amount conversion:", {
        originalAmount: amount,
        amountInPaise,
        currency,
      });

      // Create Razorpay order
      console.log("Creating Razorpay order with params:", {
        amount: amountInPaise,
        currency,
        receipt: orderId,
      });

      const razorpayOrder = await this.razorpay.orders.create({
        amount: amount * 100,
        currency,
        receipt: orderId,
      });

      console.log("Razorpay order created successfully:", {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        status: razorpayOrder.status,
      });

      // Create payment record with the same Razorpay order ID
      console.log("Creating payment record in database...");
      const payment = await this.paymentRepository.create({
        orderId,
        amount: amountInPaise,
        currency,
        status: "pending",
        razorpayOrderId: razorpayOrder.id,
        customerEmail,
        customerAddress,
      });

      console.log("Payment record created successfully:", {
        paymentId: payment._id,
        orderId: payment.orderId,
        razorpayOrderId: payment.razorpayOrderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
      });

      const response = {
        success: true,
        order: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt,
          razorpayOrderId: razorpayOrder.id,
        },
      };

      console.log("Returning payment initiation response:", response);
      console.log("=== Payment Initiation Completed ===");

      return response.order;
    } catch (error) {
      console.error("=== Payment Initiation Failed ===");
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        error,
      });
      throw new Error("Failed to initiate payment");
    }
  }

  async verifyPayment(
    orderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    razorpayOrderId: string
  ) {
    try {
      console.log("=== Payment Verification Started ===");
      console.log("Verification parameters:", {
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      // First validate we have all required parameters
      if (
        !orderId ||
        !razorpayPaymentId ||
        !razorpaySignature ||
        !razorpayOrderId
      ) {
        console.error("Missing required verification parameters");
        throw new Error("Missing required verification parameters");
      }

      // Find payment by order ID first (most reliable way)
      console.log("Finding payment record by order ID:", orderId);
      const payment = await this.paymentRepository.findByOrderId(orderId);

      if (!payment) {
        console.error("Payment record not found by order ID:", orderId);
        throw new Error("Payment not found");
      }

      console.log("Found payment record:", {
        paymentId: payment._id,
        orderId: payment.orderId,
        razorpayOrderId: payment.razorpayOrderId,
        amount: payment.amount,
        status: payment.status,
      });

      // Verify the razorpay order ID matches
      if (payment.razorpayOrderId !== razorpayOrderId) {
        console.error("Razorpay order ID mismatch:", {
          expected: payment.razorpayOrderId,
          received: razorpayOrderId,
        });
        throw new Error("Invalid razorpay order ID");
      }

      // Generate signature using Razorpay order ID and payment ID
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac("sha256", this.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      console.log("Signature verification details:", {
        received: razorpaySignature,
        expected: expectedSignature,
        isMatch: expectedSignature === razorpaySignature,
      });

      if (expectedSignature !== razorpaySignature) {
        console.error("Signature verification failed");
        throw new Error("Invalid payment signature");
      }

      console.log("Signature verification successful");

      // Update payment status
      console.log("Updating payment status to completed...");
      const updatedPayment = await this.paymentRepository.updateStatus(
        payment.orderId,
        "completed",
        { paymentId: razorpayPaymentId, signature: razorpaySignature }
      );

      console.log("Payment status updated successfully");

      // Publish events after successful payment verification
      try {
        // Ensure exchanges exist before publishing
        console.log("Asserting exchanges...");
        await this.channel.assertExchange("payment", "topic", {
          durable: true,
        });
        await this.channel.assertExchange("orders", "topic", { durable: true });
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
        console.error("Error publishing events:", {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          error,
        });
        // Don't throw error here, as payment is already verified
        // Just log the error and continue
      }

      return updatedPayment;
    } catch (error) {
      console.error("=== Payment Verification Failed ===", error);
      throw new Error(
        error instanceof Error ? error.message : "Payment verification failed"
      );
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
