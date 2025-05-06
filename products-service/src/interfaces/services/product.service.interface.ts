import { IProduct } from "../../models/product.model";

export interface IProductService {
  createProduct(data: Partial<IProduct>): Promise<IProduct>;
  getProductById(id: string): Promise<IProduct | null>;
  getAllProducts(
    page: number,
    limit: number
  ): Promise<{ products: IProduct[]; total: number }>;
  updateProduct(id: string, data: Partial<IProduct>): Promise<IProduct | null>;
  deleteProduct(id: string): Promise<boolean>;
  softDeleteProduct(id: string): Promise<IProduct | null>;
  restoreProduct(id: string): Promise<IProduct | null>;
  getFeaturedProducts(): Promise<IProduct[]>;
  getProductsByCategory(categoryId: string): Promise<IProduct[]>;
  searchProducts(query: string): Promise<IProduct[]>;
  updateStockStatus(id: string, inStock: boolean): Promise<IProduct | null>;
  getProductStats(): Promise<{
    totalProducts: number;
    activeProducts: number;
  }>;
  getTopProducts(limit?: number): Promise<any[]>;
  toggleProductStatus(id: string, active: boolean): Promise<IProduct | null>;
}
