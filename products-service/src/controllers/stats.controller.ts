import { Request, Response, NextFunction } from "express";
import { IProductService } from "../interfaces/services/product.service.interface";
import { IOrderService } from "../interfaces/services/order.service.interface";
import { sendSuccess } from "../utils/response";

export class StatsController {
  constructor(
    private productService: IProductService,
    private orderService: IOrderService
  ) {}

  getOrderStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.orderService.getOrderStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  };

  getProductStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.productService.getProductStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  };

  getRecentOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await this.orderService.getRecentOrders();
      sendSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  };

  getTopProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await this.productService.getTopProducts();
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  };
}
