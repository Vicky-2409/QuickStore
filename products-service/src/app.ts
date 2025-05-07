import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { CategoryRepository } from "./repositories/category.repository";
import { ProductRepository } from "./repositories/product.repository";
import { CategoryService } from "./services/category.service";
import { ProductService } from "./services/product.service";
import { CategoryController } from "./controllers/category.controller";
import { ProductController } from "./controllers/product.controller";
import { errorHandler } from "./utils/error-handler";
import { S3StorageService } from "./services/s3.storage.service";
import routes from "./routes";
import { config } from "./config";
import { initializeS3Client } from "./config/s3.config";
import path from "path";
import productRoutes from "./routes/product.routes";
import categoryRoutes from "./routes/category.routes";
import statsRoutes from "./routes/stats.routes";
import morgan from "morgan";
// Declare global product services
declare global {
  var productService: ProductService;
}

export const createApp = () => {
  const app = express();

  // Middleware
  app.use(morgan("dev"));
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files from uploads directory
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Initialize repositories
  const categoryRepository = new CategoryRepository();
  const productRepository = new ProductRepository();

  // Initialize services
  const storageService = new S3StorageService();
  const categoryService = new CategoryService(categoryRepository);
  global.productService = new ProductService(
    productRepository,
    categoryService,
    storageService
  );

  // Initialize controllers
  const categoryController = new CategoryController(
    categoryService,
    storageService
  );
  const productController = new ProductController(
    global.productService,
    storageService
  );

  // Routes
  app.use("/api/products", productRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/stats", statsRoutes);

  // Error handling
  app.use(errorHandler);

  // Connect to MongoDB
  mongoose
    .connect(config.mongodbUri)
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("MongoDB connection error:", error));

  // Initialize AWS S3 client
  initializeS3Client();

  return app;
};
