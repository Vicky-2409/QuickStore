import axios from "axios";
import { getValidAccessToken } from "@/utils/auth";

const API_GATEWAY_URL = "https://thestore.pw";

export interface PaymentResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  razorpayOrderId: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  orderId: string;
  paymentId: string;
  signature: string;
}

class PaymentService {
  private static instance: PaymentService;
  private constructor() {}

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  private async getAuthHeaders() {
    const token = await getValidAccessToken();
    if (!token) {
      throw new Error("No valid access token available");
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  async createPayment(
    amount: number,
    orderId: string,
    userEmail: string,
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    }
  ): Promise<PaymentResponse> {
    try {
      const response = await axios.post(
        `${API_GATEWAY_URL}/api/payments/create-order`,
        {
          amount: amount * 100, // Convert to paise
          currency: "INR",
          orderId,
          customerEmail: userEmail,
          customerAddress: address,
        },
        {
          headers: await this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating payment:", error);
      throw error;
    }
  }

  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string,
    razorpayOrderId: string
  ): Promise<PaymentVerificationResponse> {
    try {
      console.log("Verifying payment with data:", {
        orderId,
        paymentId,
        signature,
        razorpayOrderId,
      });
      const response = await axios.post(
        `${API_GATEWAY_URL}/api/payments/verify`,
        {
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          orderId,
        },
        {
          headers: await this.getAuthHeaders(),
        }
      );
      console.log("Payment verification response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw error;
    }
  }
}

export const paymentService = PaymentService.getInstance();
