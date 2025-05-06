import { Router } from "express";
import { StatsController } from "../controllers/stats.controller";
import { ProductService } from "../services/product.service";
import { OrderService } from "../services/order.service";
import { ProductRepository } from "../repositories/product.repository";
import { OrderRepository } from "../repositories/order.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { CategoryService } from "../services/category.service";
import { S3StorageService } from "../services/s3.storage.service";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware";

const router = Router();

// Initialize dependencies
const productRepository = new ProductRepository();
const orderRepository = new OrderRepository();
const categoryRepository = new CategoryRepository();
const storageService = new S3StorageService();
const categoryService = new CategoryService(categoryRepository);
const productService = new ProductService(
  productRepository,
  categoryService,
  storageService
);
const orderService = new OrderService(orderRepository);
const statsController = new StatsController(productService, orderService);

// Protected routes
router.get(
  "/products",
  authenticate,
  authorizeAdmin,
  statsController.getProductStats
);

router.get(
  "/orders",
  authenticate,
  authorizeAdmin,
  statsController.getOrderStats
);

router.get(
  "/recent-orders",
  authenticate,
  authorizeAdmin,
  statsController.getRecentOrders
);

router.get(
  "/top-products",
  authenticate,
  authorizeAdmin,
  statsController.getTopProducts
);

export default router;
