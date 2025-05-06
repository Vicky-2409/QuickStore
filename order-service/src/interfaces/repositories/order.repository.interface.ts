import { IOrder } from "../../models/order.model";
import {
  OrderStatus,
  PaymentStatus,
} from "../services/order.service.interface";

export interface IOrderRepository {
  save(order: IOrder): Promise<IOrder>;
  findById(id: string): Promise<IOrder | null>;
  findByUserEmail(userEmail: string): Promise<IOrder[]>;
  updateStatus(id: string, status: OrderStatus): Promise<IOrder | null>;
  findByUserId(userId: string): Promise<IOrder[]>;
  findUnassignedOrders(): Promise<IOrder[]>;
  updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatus
  ): Promise<IOrder | null>;
  findAll(): Promise<IOrder[]>;
}
