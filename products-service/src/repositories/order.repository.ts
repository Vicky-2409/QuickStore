import { IOrder } from "../models/order.model";
import { IOrderRepository } from "../interfaces/repositories/order.repository.interface";
import { OrderModel } from "../models/order.model";
import { FilterQuery } from "mongoose";

export class OrderRepository implements IOrderRepository {
  async create(data: Partial<IOrder>): Promise<IOrder> {
    const order = new OrderModel(data);
    return order.save();
  }

  async findById(id: string): Promise<IOrder | null> {
    return OrderModel.findById(id).populate("userId", "name email");
  }

  async findAll(): Promise<IOrder[]> {
    return OrderModel.find().populate("userId", "name email");
  }

  async findOne(conditions: FilterQuery<IOrder>): Promise<IOrder | null> {
    return OrderModel.findOne(conditions).populate("userId", "name email");
  }

  async find(conditions: FilterQuery<IOrder>): Promise<IOrder[]> {
    return OrderModel.find(conditions).populate("userId", "name email");
  }

  async update(id: string, data: Partial<IOrder>): Promise<IOrder | null> {
    return OrderModel.findByIdAndUpdate(id, data, { new: true }).populate(
      "userId",
      "name email"
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await OrderModel.findByIdAndDelete(id);
    return !!result;
  }

  async countDocuments(query: any = {}): Promise<number> {
    return OrderModel.countDocuments(query);
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    return OrderModel.aggregate(pipeline);
  }
}
