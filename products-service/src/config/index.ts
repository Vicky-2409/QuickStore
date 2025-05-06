import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 4002,
  mongodbUri: process.env.MONGODB_URI || "mongodb+srv://svignesh2409:GOgxz3UEBjCrSNtl@cluster0.hchjyx3.mongodb.net/quick-store-products-service",
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    bucketName: process.env.AWS_BUCKET_NAME,
  },
}; 