import { Request, Response, NextFunction } from "express";
import { ICategoryService } from "../interfaces/services/category.service.interface";
import { sendSuccess, sendError } from "../utils/response";
import { AppError } from "../utils/error-handler";
import { generateImageUploadUrl } from "../utils/file-upload";
import { S3StorageService } from "../services/s3.storage.service";

export class CategoryController {
  constructor(
    private categoryService: ICategoryService,
    private storageService: S3StorageService
  ) {}

  createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let imageUrl;
      if (req.file) {
        try {
          // Validate the file
          this.storageService.validateImageFile(req.file);

          const timestamp = Date.now();
          const fileExtension = req.file.originalname
            .split(".")
            .pop()
            ?.toLowerCase();
          const key = `categories/${timestamp}.${fileExtension}`;

          // Upload to S3
          const uploadUrl = await this.storageService.getUploadUrl(key);
          const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            body: req.file.buffer,
            headers: {
              "Content-Type": req.file.mimetype,
              "Cache-Control": "max-age=31536000",
            },
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new AppError(
              `Failed to upload image to S3: ${uploadResponse.statusText} - ${errorText}`,
              500
            );
          }

          // Get the public URL
          imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        } catch (error) {
          console.error("Error uploading image:", error);
          throw new AppError("Failed to upload image", 500);
        }
      }

      const category = await this.categoryService.createCategory({
        name: req.body.name,
        description: req.body.description,
        active: req.body.active === "true" || req.body.active === true,
        imageUrl,
      });
      sendSuccess(res, category, "Category created successfully", 201);
    } catch (error) {
      next(error);
    }
  };

  getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Getting category by ID:", req.params.id);
      const category = await this.categoryService.getCategoryById(
        req.params.id
      );
      console.log("Found category:", category);
      if (!category) {
        throw new AppError("Category not found", 404);
      }
      sendSuccess(res, category);
    } catch (error) {
      console.error("Error in getCategoryById:", error);
      next(error);
    }
  };

  getAllCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const categories = await this.categoryService.getAllCategories();
      sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Updating category with ID:", req.params.id);
      console.log("Update data:", {
        name: req.body.name,
        description: req.body.description,
        active: req.body.active,
        hasImage: !!req.file,
      });

      let imageUrl;
      if (req.file) {
        try {
          // Validate the file
          this.storageService.validateImageFile(req.file);

          const timestamp = Date.now();
          const fileExtension = req.file.originalname
            .split(".")
            .pop()
            ?.toLowerCase();
          const key = `categories/${timestamp}.${fileExtension}`;

          // Upload to S3
          const uploadUrl = await this.storageService.getUploadUrl(key);
          const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            body: req.file.buffer,
            headers: {
              "Content-Type": req.file.mimetype,
              "Cache-Control": "max-age=31536000",
            },
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new AppError(
              `Failed to upload image to S3: ${uploadResponse.statusText} - ${errorText}`,
              500
            );
          }

          // Get the public URL
          imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
          console.log("Image uploaded successfully, URL:", imageUrl);
        } catch (error) {
          console.error("Error uploading image:", error);
          throw new AppError("Failed to upload image", 500);
        }
      }

      const category = await this.categoryService.updateCategory(
        req.params.id,
        {
          name: req.body.name,
          description: req.body.description,
          active: req.body.active === "true" || req.body.active === true,
          imageUrl,
        }
      );
      console.log("Category updated successfully:", category);
      sendSuccess(res, category, "Category updated successfully");
    } catch (error) {
      console.error("Error in updateCategory:", error);
      next(error);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const success = await this.categoryService.deleteCategory(req.params.id);
      if (!success) {
        throw new AppError("Category not found", 404);
      }
      sendSuccess(res, null, "Category deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  getActiveCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const categories = await this.categoryService.getActiveCategories();
      sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  };
}
