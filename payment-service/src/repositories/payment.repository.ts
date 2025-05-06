import { Service } from "typedi";
import { Payment, IPayment } from "../models/payment.model";

@Service()
export class PaymentRepository {
  async create(paymentData: Partial<IPayment>): Promise<IPayment> {
    const payment = new Payment(paymentData);
    return await payment.save();
  }

  async findByOrderId(orderId: string): Promise<IPayment | null> {
    return await Payment.findOne({ orderId });
  }

  async updateStatus(
    orderId: string,
    status: "completed" | "failed",
    razorpayData: {
      paymentId: string;
      signature?: string;
    }
  ): Promise<IPayment | null> {
    return await Payment.findOneAndUpdate(
      { orderId },
      {
        status,
        razorpayPaymentId: razorpayData.paymentId,
        razorpaySignature: razorpayData.signature,
        updatedAt: new Date(),
      },
      { new: true }
    );
  }

  async updateRazorpayOrderId(
    orderId: string,
    razorpayOrderId: string
  ): Promise<IPayment | null> {
    return await Payment.findOneAndUpdate(
      { orderId },
      { razorpayOrderId, updatedAt: new Date() },
      { new: true }
    );
  }

  async findByRazorpayOrderId(
    razorpayOrderId: string
  ): Promise<IPayment | null> {
    return await Payment.findOne({ razorpayOrderId });
  }
}
