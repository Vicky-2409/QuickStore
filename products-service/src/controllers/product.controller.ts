import { Request, Response, NextFunction } from "express";
import { IProductService } from "../interfaces/services/product.service.interface";
import { sendSuccess, sendPaginatedResponse } from "../utils/response";
import { AppError } from "../utils/error-handler";
import { S3StorageService } from "../services/s3.storage.service";

export class ProductController {
  constructor(
    private productService: IProductService,
    private storageService: S3StorageService
  ) {}

  createProduct = async (req: Request, res: Response, next: NextFunction) => {
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
          const key = `products/${timestamp}.${fileExtension}`;

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

      const product = await this.productService.createProduct({
        name: req.body.name,
        description: req.body.description,
        price: parseFloat(req.body.price),
        categoryId: req.body.categoryId,
        stock: parseInt(req.body.stock),
        active: req.body.active === "true" || req.body.active === true,
        imageUrl,
      });
      sendSuccess(res, product, "Product created successfully", 201);
    } catch (error) {
      next(error);
    }
  };

  getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await this.productService.getProductById(req.params.id);
      if (!product) {
        throw new AppError("Product not found", 404);
      }
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  };

  getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { products, total } = await this.productService.getAllProducts(
        page,
        limit
      );
      sendPaginatedResponse(res, products, total, page, limit);
    } catch (error) {
      next(error);
    }
  };

  updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      let imageUrl = req.body.imageUrl;

      if (req.file) {
        try {
          // Validate the file
          this.storageService.validateImageFile(req.file);

          const timestamp = Date.now();
          const fileExtension = req.file.originalname
            .split(".")
            .pop()
            ?.toLowerCase();
          const key = `products/${timestamp}.${fileExtension}`;

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

      const productData = {
        name: req.body.name,
        description: req.body.description,
        price: parseFloat(req.body.price),
        categoryId: req.body.categoryId,
        stock: parseInt(req.body.stock),
        active: req.body.active === "true" || req.body.active === true,
        imageUrl,
      };

      const product = await this.productService.updateProduct(id, productData);
      if (!product) {
        throw new AppError("Product not found", 404);
      }
      sendSuccess(res, product, "Product updated successfully");
    } catch (error) {
      next(error);
    }
  };

  deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const success = await this.productService.deleteProduct(id);
      if (!success) {
        throw new AppError("Product not found", 404);
      }
      sendSuccess(res, null, "Product deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  getFeaturedProducts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const products = await this.productService.getFeaturedProducts();
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  };

  getProductsByCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const products = await this.productService.getProductsByCategory(
        req.params.categoryId
      );
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  };

  searchProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== "string") {
        throw new AppError("Search query is required", 400);
      }
      const products = await this.productService.searchProducts(query);
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  };

  updateStockStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { inStock } = req.body;
      if (typeof inStock !== "boolean") {
        throw new AppError("inStock must be a boolean", 400);
      }
      const product = await this.productService.updateStockStatus(
        req.params.id,
        inStock
      );
      if (!product) {
        throw new AppError("Product not found", 404);
      }
      sendSuccess(res, product, "Stock status updated successfully");
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

  getTopProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const products = await this.productService.getTopProducts(limit);
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  };

  toggleProductStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { active } = req.body;

      if (typeof active !== "boolean") {
        throw new AppError("active must be a boolean", 400);
      }

      const product = await this.productService.toggleProductStatus(id, active);
      if (!product) {
        throw new AppError("Product not found", 404);
      }
      sendSuccess(res, product, "Product status updated successfully");
    } catch (error) {
      next(error);
    }
  };

  softDeleteProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const product = await this.productService.softDeleteProduct(id);
      if (!product) {
        throw new AppError("Product not found", 404);
      }
      sendSuccess(res, product, "Product soft deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  restoreProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const product = await this.productService.restoreProduct(id);
      if (!product) {
        throw new AppError("Product not found", 404);
      }
      sendSuccess(res, product, "Product restored successfully");
    } catch (error) {
      next(error);
    }
  };
}
