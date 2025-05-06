import { IProduct } from "../models/product.model";
import { IProductService } from "../interfaces/services/product.service.interface";
import { IProductRepository } from "../interfaces/repositories/product.repository.interface";
import { ICategoryService } from "../interfaces/services/category.service.interface";
import { AppError } from "../utils/error-handler";
import { S3StorageService } from "./s3.storage.service";
import { Types } from "mongoose";
import { IStorageService } from "../interfaces/services/storage.service.interface";
import { Product } from "../models/product.model";

export class ProductService implements IProductService {
  constructor(
    private productRepository: IProductRepository,
    private categoryService: ICategoryService,
    private storageService: IStorageService
  ) {}

  async createProduct(data: Partial<IProduct>): Promise<IProduct> {
    // Check if category exists
    const category = await this.categoryService.getCategoryById(
      data.categoryId?.toString() || ""
    );
    if (!category) {
      throw new AppError("Category not found", 404);
    }

    // The imageUrl is already set by the upload middleware
    // No need to generate a new URL here

    return this.productRepository.create(data);
  }

  async getProductById(id: string): Promise<IProduct | null> {
    return this.productRepository.findById(id);
  }

  async getAllProducts(
    page: number = 1,
    limit: number = 10
  ): Promise<{ products: IProduct[]; total: number }> {
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      this.productRepository.find({}, { skip, limit }),
      this.productRepository.countDocuments({}),
    ]);

    return {
      products,
      total,
    };
  }

  async updateProduct(
    id: string,
    data: Partial<IProduct>
  ): Promise<IProduct | null> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    // Check if category exists if categoryId is being updated
    if (data.categoryId && data.categoryId !== product.categoryId) {
      const category = await this.categoryService.getCategoryById(
        data.categoryId.toString()
      );
      if (!category) {
        throw new AppError("Category not found", 404);
      }
    }

    // The imageUrl is already set by the upload middleware
    // No need to generate a new URL here

    return this.productRepository.update(id, data);
  }

  async deleteProduct(id: string): Promise<boolean> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    // Delete image from S3 if exists
    if (product.imageUrl) {
      // Note: S3 deletion is handled by the lifecycle policy
      // No need to explicitly delete the file
    }

    return this.productRepository.delete(id);
  }

  async getFeaturedProducts(): Promise<IProduct[]> {
    return this.productRepository.find({ featured: true });
  }

  async getProductsByCategory(categoryId: string): Promise<IProduct[]> {
    return this.productRepository.find({ categoryId });
  }

  async searchProducts(query: string): Promise<IProduct[]> {
    return this.productRepository.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    });
  }

  async updateStockStatus(
    id: string,
    inStock: boolean
  ): Promise<IProduct | null> {
    return this.productRepository.update(id, { inStock });
  }

  async getProductStats(): Promise<{
    totalProducts: number;
    activeProducts: number;
  }> {
    const [totalProducts, activeProducts] = await Promise.all([
      this.productRepository.countDocuments({}),
      this.productRepository.countDocuments({ active: true }),
    ]);

    return {
      totalProducts,
      activeProducts,
    };
  }

  async getTopProducts(limit: number = 5): Promise<IProduct[]> {
    return this.productRepository.find(
      { active: true },
      { limit, sort: { createdAt: -1 } }
    );
  }

  async toggleProductStatus(
    id: string,
    active: boolean
  ): Promise<IProduct | null> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    product.active = active;
    return this.productRepository.update(id, product);
  }

  async softDeleteProduct(id: string): Promise<IProduct | null> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return this.productRepository.update(id, { deleted: true });
  }

  async restoreProduct(id: string): Promise<IProduct | null> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return this.productRepository.update(id, { deleted: false });
  }
}
