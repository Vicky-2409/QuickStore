import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const initializeS3Client = () => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS credentials not configured");
  }
  return s3Client;
};

export const getUploadUrl = async (key: string) => {
  const fileExtension = key.split(".").pop()?.toLowerCase();
  const contentType =
    fileExtension === "jpg" || fileExtension === "jpeg"
      ? "image/jpeg"
      : fileExtension === "png"
      ? "image/png"
      : "image/jpeg"; // default to jpeg if unknown

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    CacheControl: "max-age=31536000",
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: 3600,
    signableHeaders: new Set(["content-type", "cache-control"]),
  });
};

export const getImageUrl = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};
