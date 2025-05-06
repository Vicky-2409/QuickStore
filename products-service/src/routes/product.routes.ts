import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { ProductService } from "../services/product.service";
import { ProductRepository } from "../repositories/product.repository";
import { CategoryService } from "../services/category.service";
import { CategoryRepository } from "../repositories/category.repository";
import { S3StorageService } from "../services/s3.storage.service";
import {
  authenticate,
  authorizeAdmin,
  authorizeCustomer,
  authorizeDeliveryPartner,
} from "../middleware/auth.middleware";
import { upload, handleS3Upload } from "../middleware/upload.middleware";
import {
  validateRequest,
  validatePagination,
} from "../middleware/validation.middleware";
import {
  createProductValidator,
  updateProductValidator,
} from "../validators/product.validator";

const router = Router();

// Initialize dependencies
const productRepository = new ProductRepository();
const categoryRepository = new CategoryRepository();
const storageService = new S3StorageService();
const categoryService = new CategoryService(categoryRepository);
const productService = new ProductService(
  productRepository,
  categoryService,
  storageService
);
const productController = new ProductController(productService, storageService);

// Public routes
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.get("/featured", productController.getFeaturedProducts);
router.get("/category/:categoryId", productController.getProductsByCategory);
router.get("/search", productController.searchProducts);

// Customer routes
router.get(
  "/top",
  authenticate,
  authorizeCustomer,
  productController.getTopProducts
);

// Admin routes
router.post(
  "/",
  authenticate,
  authorizeAdmin,
  upload.single("image"),
  handleS3Upload,
  createProductValidator,
  validateRequest,
  productController.createProduct
);

router.put(
  "/:id",
  authenticate,
  authorizeAdmin,
  upload.single("image"),
  handleS3Upload,
  updateProductValidator,
  validateRequest,
  productController.updateProduct
);

router.delete(
  "/:id",
  authenticate,
  authorizeAdmin,
  productController.deleteProduct
);

router.delete(
  "/:id/soft",
  authenticate,
  authorizeAdmin,
  productController.softDeleteProduct
);

router.post(
  "/:id/restore",
  authenticate,
  authorizeAdmin,
  productController.restoreProduct
);

router.patch(
  "/:id/status",
  authenticate,
  authorizeAdmin,
  productController.toggleProductStatus
);

router.patch(
  "/:id/stock",
  authenticate,
  authorizeAdmin,
  productController.updateStockStatus
);

router.get(
  "/stats",
  authenticate,
  authorizeAdmin,
  productController.getProductStats
);

export default router;
