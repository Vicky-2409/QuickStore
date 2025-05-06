import { IOrder } from "../../models/order.model";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "assigned"
  | "picked_up"
  | "on_the_way"
  | "delivered";

export type PaymentStatus = "pending" | "completed" | "failed";

export interface CreateOrderDTO {
  items: Array<{
    product: {
      _id: string;
      name: string;
      price: number;
      imageUrl?: string;
    };
    quantity: number;
  }>;
  total: number;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  userEmail: string;
}

export interface IOrderService {
  createOrder(data: CreateOrderDTO): Promise<IOrder>;
  getOrders(userEmail: string): Promise<IOrder[]>;
  getAllOrders(): Promise<IOrder[]>;
  updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>;
  getOrderById(orderId: string): Promise<IOrder>;
  getUnassignedOrders(): Promise<IOrder[]>;
  updatePaymentStatus(orderId: string, status: PaymentStatus): Promise<void>;
}
