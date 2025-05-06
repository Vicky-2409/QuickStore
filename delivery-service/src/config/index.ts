import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 4005,
  nodeEnv: process.env.NODE_ENV || "development",

  mongodb: {
    uri:
      process.env.MONGODB_URI ||
      "mongodb+srv://svignesh2409:GOgxz3UEBjCrSNtl@cluster0.hchjyx3.mongodb.net/quick-store-delivery-service",
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || "",
    queuePrefix: process.env.RABBITMQ_QUEUE_PREFIX || "delivery",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
};
