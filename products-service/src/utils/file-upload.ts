import { Request, Response, NextFunction } from "express";
import { getUploadUrl } from "../config/s3.config";
import { AppError } from "./error-handler";

export const generateImageUploadUrl = async (
  req: Request,
  folder: string = "products"
) => {
  try {
    const timestamp = Date.now();
    const fileExtension = req.query.fileType || "jpg";
    const key = `${folder}/${timestamp}.${fileExtension}`;

    const uploadUrl = await getUploadUrl(key);
    return {
      uploadUrl,
      key,
      expiresIn: 3600, // 1 hour
    };
  } catch (error) {
    throw new AppError("Failed to generate upload URL", 500);
  }
};

export const validateImageFile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return next();
  }

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(req.file.mimetype)) {
    return next(
      new AppError(
        "Invalid file type. Only JPEG, JPG, and PNG are allowed.",
        400
      )
    );
  }

  if (req.file.size > maxSize) {
    return next(new AppError("File size exceeds 5MB limit.", 400));
  }

  next();
};
