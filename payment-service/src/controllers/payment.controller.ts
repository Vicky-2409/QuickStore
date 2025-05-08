import { Controller, Post, Body } from "routing-controllers";
import { Service, Inject, Container } from "typedi";
import { PaymentService } from "../services/payment.service";

@Controller("/api/payments")
@Service()
export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = Container.get("paymentService");
  }

  @Post("/create-order")
  async createOrder(
    @Body()
    body: {
      amount: number;
      orderId: string;
      customerEmail: string;
      customerAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
      };
    }
  ) {
    try {
      // Validate required fields
      if (
        !body.amount ||
        !body.orderId ||
        !body.customerEmail ||
        !body.customerAddress
      ) {
        throw new Error("Missing required fields for payment creation");
      }

      if (
        !body.customerAddress.street ||
        !body.customerAddress.city ||
        !body.customerAddress.state ||
        !body.customerAddress.zipCode ||
        !body.customerAddress.country
      ) {
        throw new Error("Missing required address fields");
      }

      console.log("Creating payment with data:", body);

      const order = await this.paymentService.initiatePayment(
        body.orderId,
        body.amount,
        body.customerEmail,
        body.customerAddress
      );

      return { success: true, order };
    } catch (error) {
      console.error("Error creating order:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to create order"
      );
    }
  }

  @Post("/verify")
  async verifyPayment(
    @Body()
    body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      orderId: string;
    }
  ) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderId,
      } = body;

      // Validate required fields
      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature ||
        !orderId
      ) {
        console.error("Missing required fields:", {
          razorpay_order_id: !!razorpay_order_id,
          razorpay_payment_id: !!razorpay_payment_id,
          razorpay_signature: !!razorpay_signature,
          orderId: !!orderId,
        });
        throw new Error("Missing required fields for payment verification");
      }

      console.log("Verifying payment with data:", {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        orderId,
      });

      const result = await this.paymentService.verifyPayment(
        orderId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      console.log("Payment verification successful");
      return {
        success: true,
        message: "Payment verified successfully",
        result,
      };
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw new Error(
        error instanceof Error ? error.message : "Payment verification failed"
      );
    }
  }
}
