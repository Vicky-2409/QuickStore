import multer from "multer";
import { S3StorageService } from "../services/s3.storage.service";
import { AppError } from "../utils/error-handler";

const storageService = new S3StorageService();

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload an image."), false);
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware to handle S3 upload after multer
export const handleS3Upload = async (req: any, res: any, next: any) => {
  if (req.file) {
    try {
      // Validate the file
      storageService.validateImageFile(req.file);

      // Generate a unique key for S3
      const key = `products/${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}${req.file.originalname.substring(
        req.file.originalname.lastIndexOf(".")
      )}`;

      // Get the upload URL
      const uploadUrl = await storageService.getUploadUrl(key);

      // Upload the file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: req.file.buffer,
        headers: {
          "Content-Type": req.file.mimetype,
          "Cache-Control": "max-age=31536000",
        },
      });

      if (!uploadResponse.ok) {
        throw new AppError("Failed to upload image to S3", 500);
      }

      // Store the public URL in req.body for the controller to use
      req.body.imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
};
