import { Service, Inject } from "typedi";
import { IOrderRepository } from "../interfaces/repositories/order.repository.interface";
import {
  IOrderService,
  CreateOrderDTO,
  OrderStatus,
} from "../interfaces/services/order.service.interface";
import { IOrder, Order } from "../models/order.model";

@Service()
export class OrderService implements IOrderService {
  constructor(
    @Inject("orderRepository") private orderRepository: IOrderRepository
  ) {}

  async createOrder(data: CreateOrderDTO): Promise<IOrder> {
    const order = new Order({
      items: data.items,
      total: data.total,
      status: "pending" as const,
      address: data.address,
      userEmail: data.userEmail,
      createdAt: new Date(),
      paymentStatus: "pending" as const,
    });

    return this.orderRepository.save(order);
  }

  async getOrders(userEmail: string): Promise<IOrder[]> {
    return this.orderRepository.findByUserEmail(userEmail);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    try {
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        throw new Error(`Order not found with ID: ${orderId}`);
      }

      // Map delivery service status to order service status if needed
      const mappedStatus = this.mapDeliveryStatus(status);

      // Update the order status
      await this.orderRepository.updateStatus(orderId, mappedStatus);
      console.log(`Order ${orderId} status updated to ${mappedStatus}`);
    } catch (error) {
      console.error(`Error updating order status for order ${orderId}:`, error);
      throw error;
    }
  }

  private mapDeliveryStatus(status: string): OrderStatus {
    // Map delivery service statuses to order service statuses
    const statusMap: { [key: string]: OrderStatus } = {
      assigned: "assigned",
      picked_up: "picked_up",
      on_the_way: "on_the_way",
      delivered: "delivered",
      pending: "pending",
      accepted: "accepted",
    };

    const mappedStatus = statusMap[status];
    if (!mappedStatus) {
      throw new Error(`Invalid order status: ${status}`);
    }

    return mappedStatus;
  }

  async getOrderById(orderId: string): Promise<IOrder> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    return order;
  }

  async getUnassignedOrders(): Promise<IOrder[]> {
    return this.orderRepository.findUnassignedOrders();
  }

  async getAllOrders(): Promise<IOrder[]> {
    try {
      return await Order.find().sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error in getAllOrders:", error);
      throw error;
    }
  }

  async getOrdersByUserEmail(userEmail: string): Promise<IOrder[]> {
    try {
      return await Order.find({ userEmail }).sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error in getOrdersByUserEmail:", error);
      throw error;
    }
  }

  async updatePaymentStatus(
    orderId: string,
    status: "completed" | "failed"
  ): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await this.orderRepository.updatePaymentStatus(orderId, status);
  }
}
