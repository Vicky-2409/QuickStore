import { Router } from "express";
import { CategoryController } from "../controllers/category.controller";
import { CategoryService } from "../services/category.service";
import { CategoryRepository } from "../repositories/category.repository";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import {
  createCategoryValidator,
  updateCategoryValidator,
} from "../validators/category.validator";
import { validateImageFile } from "../utils/file-upload";
import multer from "multer";
import { S3StorageService } from "../services/s3.storage.service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Initialize dependencies
const categoryRepository = new CategoryRepository();
const storageService = new S3StorageService();
const categoryService = new CategoryService(categoryRepository);
const categoryController = new CategoryController(
  categoryService,
  storageService
);

const router = Router();

// Public routes
router.get("/", categoryController.getAllCategories);
router.get("/active", categoryController.getActiveCategories);
router.get("/:id", categoryController.getCategoryById);

// Protected routes (Admin only)
router.post(
  "/",
  authenticate,
  authorizeAdmin,
  upload.single("image"),
  validateImageFile,
  createCategoryValidator,
  validateRequest,
  categoryController.createCategory
);

router.put(
  "/:id",
  authenticate,
  authorizeAdmin,
  upload.single("image"),
  validateImageFile,
  updateCategoryValidator,
  validateRequest,
  categoryController.updateCategory
);

router.delete(
  "/:id",
  authenticate,
  authorizeAdmin,
  categoryController.deleteCategory
);

export default router;
