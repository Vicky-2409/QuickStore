import { IStorageService } from "../interfaces/services/storage.service.interface";
import { getUploadUrl, getImageUrl } from "../config/s3.config";
import { AppError } from "../utils/error-handler";

export class S3StorageService implements IStorageService {
  async getUploadUrl(key: string): Promise<string> {
    try {
      return await getUploadUrl(key);
    } catch (error) {
      throw new AppError("Failed to generate upload URL", 500);
    }
  }

  async getImageUrl(key: string): Promise<string> {
    try {
      return await getImageUrl(key);
    } catch (error) {
      throw new AppError("Failed to generate image URL", 500);
    }
  }

  validateImageFile(file: Express.Multer.File): boolean {
    if (!file) {
      throw new AppError("No file provided", 400);
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!file.mimetype || !allowedTypes.includes(file.mimetype)) {
      throw new AppError(
        `Invalid file type. Only JPEG, PNG, and GIF are allowed. Received: ${file.mimetype}`,
        400
      );
    }

    if (!file.size || file.size > maxSize) {
      throw new AppError(
        `File size exceeds 5MB limit. Size: ${file.size} bytes`,
        400
      );
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new AppError("File buffer is empty", 400);
    }

    return true;
  }
}
