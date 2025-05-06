import { IOrder } from "../../models/order.model";
import { FilterQuery } from "mongoose";

export interface IOrderRepository {
  create(data: Partial<IOrder>): Promise<IOrder>;
  findById(id: string): Promise<IOrder | null>;
  findAll(): Promise<IOrder[]>;
  findOne(conditions: FilterQuery<IOrder>): Promise<IOrder | null>;
  find(conditions: FilterQuery<IOrder>): Promise<IOrder[]>;
  update(id: string, data: Partial<IOrder>): Promise<IOrder | null>;
  delete(id: string): Promise<boolean>;
  countDocuments(query?: any): Promise<number>;
  aggregate(pipeline: any[]): Promise<any[]>;
} 