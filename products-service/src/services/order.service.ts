import { IOrder } from "../models/order.model";
import { IOrderService } from "../interfaces/services/order.service.interface";
import { IOrderRepository } from "../interfaces/repositories/order.repository.interface";
import { AppError } from "../utils/error-handler";

export class OrderService implements IOrderService {
  constructor(private orderRepository: IOrderRepository) {}

  async createOrder(data: Partial<IOrder>): Promise<IOrder> {
    const order = await this.orderRepository.create(data);
    const createdOrder = await this.getOrderById(order._id.toString());
    if (!createdOrder) {
      throw new AppError("Failed to create order", 500);
    }
    return createdOrder;
  }

  async getOrderById(id: string): Promise<IOrder | null> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    return order;
  }

  async getAllOrders(
    page: number,
    limit: number
  ): Promise<{ orders: IOrder[]; total: number }> {
    const skip = (page - 1) * limit;
    const orders = await this.orderRepository
      .find({})
      .then((orders: IOrder[]) => orders.slice(skip, skip + limit));
    const total = await this.orderRepository.countDocuments();
    return { orders, total };
  }

  async updateOrder(id: string, data: Partial<IOrder>): Promise<IOrder | null> {
    const order = await this.getOrderById(id);
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    return this.orderRepository.update(id, data);
  }

  async deleteOrder(id: string): Promise<boolean> {
    const order = await this.getOrderById(id);
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    return this.orderRepository.delete(id);
  }

  async getOrderStats() {
    const totalOrders = await this.orderRepository.countDocuments();
    const totalRevenue = await this.orderRepository.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ]);
    const averageOrderValue =
      totalOrders > 0 ? totalRevenue[0]?.total / totalOrders : 0;
    return {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      averageOrderValue,
    };
  }

  async getRecentOrders(limit = 5) {
    const orders = await this.orderRepository.find({});
    return orders
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}
