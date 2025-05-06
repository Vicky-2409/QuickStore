import { IOrder } from "../../models/order.model";

export interface IOrderService {
  createOrder(data: Partial<IOrder>): Promise<IOrder>;
  getOrderById(id: string): Promise<IOrder | null>;
  getAllOrders(
    page: number,
    limit: number
  ): Promise<{ orders: IOrder[]; total: number }>;
  updateOrder(id: string, data: Partial<IOrder>): Promise<IOrder | null>;
  deleteOrder(id: string): Promise<boolean>;
  getOrderStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  }>;
  getRecentOrders(limit?: number): Promise<IOrder[]>;
}
