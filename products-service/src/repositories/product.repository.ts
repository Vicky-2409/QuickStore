import { IProduct } from "../models/product.model";
import { IProductRepository } from "../interfaces/repositories/product.repository.interface";
import { Product } from "../models/product.model";
import { FilterQuery } from "mongoose";

export class ProductRepository implements IProductRepository {
  async create(data: Partial<IProduct>): Promise<IProduct> {
    const product = new Product(data);
    return product.save();
  }

  async find(
    filter: any,
    options?: {
      skip?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
    }
  ): Promise<IProduct[]> {
    let query = Product.find(filter).populate("categoryId", "name _id");

    if (options?.skip) {
      query = query.skip(options.skip);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.sort) {
      query = query.sort(options.sort);
    }

    return query.exec();
  }

  async findById(id: string): Promise<IProduct | null> {
    return Product.findById(id).populate("categoryId", "name _id").exec();
  }

  async findAll(): Promise<IProduct[]> {
    return Product.find({ deleted: { $ne: true } })
      .populate("categoryId", "name _id")
      .exec();
  }

  async findOne(conditions: FilterQuery<IProduct>): Promise<IProduct | null> {
    return Product.findOne({ ...conditions, deleted: { $ne: true } })
      .populate("categoryId", "name _id")
      .exec();
  }

  async update(id: string, data: Partial<IProduct>): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(id, data, { new: true })
      .populate("categoryId", "name _id")
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await Product.findByIdAndUpdate(
      id,
      { deleted: true },
      { new: true }
    ).exec();
    return !!result;
  }

  async findFeaturedProducts(): Promise<IProduct[]> {
    return Product.find({ featured: true })
      .populate("categoryId", "name _id")
      .exec();
  }

  async findByCategory(categoryId: string): Promise<IProduct[]> {
    return Product.find({ categoryId })
      .populate("categoryId", "name _id")
      .exec();
  }

  async searchProducts(query: string): Promise<IProduct[]> {
    return Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    })
      .populate("categoryId", "name _id")
      .exec();
  }

  async updateStockStatus(
    id: string,
    inStock: boolean
  ): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(id, { inStock }, { new: true })
      .populate("categoryId", "name _id")
      .exec();
  }

  async countDocuments(filter?: any): Promise<number> {
    return Product.countDocuments(filter).exec();
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    return Product.aggregate(pipeline).exec();
  }
}
