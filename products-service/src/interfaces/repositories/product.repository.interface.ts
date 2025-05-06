import { IProduct } from "../../models/product.model";
import { FilterQuery } from "mongoose";

export interface IProductRepository {
  create(data: Partial<IProduct>): Promise<IProduct>;
  find(
    filter: any,
    options?: {
      skip?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
    }
  ): Promise<IProduct[]>;
  findById(id: string): Promise<IProduct | null>;
  findAll(): Promise<IProduct[]>;
  findOne(conditions: FilterQuery<IProduct>): Promise<IProduct | null>;
  update(id: string, data: Partial<IProduct>): Promise<IProduct | null>;
  delete(id: string): Promise<boolean>;
  findFeaturedProducts(): Promise<IProduct[]>;
  findByCategory(categoryId: string): Promise<IProduct[]>;
  searchProducts(query: string): Promise<IProduct[]>;
  updateStockStatus(id: string, inStock: boolean): Promise<IProduct | null>;
  countDocuments(filter?: any): Promise<number>;
  aggregate(pipeline: any[]): Promise<any[]>;
}
