import { Service } from "typedi";
import { IOrderRepository } from "../interfaces/repositories/order.repository.interface";
import { Order, IOrder } from "../models/order.model";
import {
  OrderStatus,
  PaymentStatus,
} from "../interfaces/services/order.service.interface";

@Service()
export class OrderRepository implements IOrderRepository {
  async save(order: IOrder): Promise<IOrder> {
    return order.save();
  }

  async findById(id: string): Promise<IOrder | null> {
    return Order.findById(id);
  }

  async findByUserEmail(userEmail: string): Promise<IOrder[]> {
    return Order.find({ userEmail }).sort({ createdAt: -1 });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<IOrder | null> {
    return Order.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );
  }

  async findByUserId(userId: string): Promise<IOrder[]> {
    return Order.find({ userId }).sort({ createdAt: -1 });
  }

  async findUnassignedOrders(): Promise<IOrder[]> {
    return Order.find({
      status: "pending",
      deliveryPartnerId: { $exists: false },
    }).sort({ createdAt: 1 });
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatus
  ): Promise<IOrder | null> {
    return Order.findByIdAndUpdate(
      id,
      { paymentStatus, updatedAt: new Date() },
      { new: true }
    );
  }

  async findAll(): Promise<IOrder[]> {
    return Order.find().sort({ createdAt: -1 });
  }
}
