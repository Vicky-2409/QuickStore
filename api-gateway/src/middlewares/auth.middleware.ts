import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/appError";

// Role constants to match frontend
export const USER_ROLES = {
  ADMIN: "admin",
  CUSTOMER: "customer",
  DELIVERY_PARTNER: "delivery_partner",
} as const;

type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for service token first
    const serviceToken = req.headers["x-service-token"];
    if (serviceToken) {
      // Validate service token
      const validServiceTokens = process.env.SERVICE_TOKENS?.split(",") || [];
      if (validServiceTokens.includes(serviceToken as string)) {
        // Service token is valid, proceed
        return next();
      }
      return res.status(401).json({ message: "Invalid service token" });
    }

    // If no service token, check for user token
    const authHeader = req.headers.authorization;
    console.log("Auth header:", authHeader);

    if (!authHeader) {
      console.log("No auth header found");
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    console.log("Token:", token ? "Present" : "Missing");

    if (!token) {
      console.log("No token found in auth header");
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    if (typeof decoded !== "object" || !decoded.email || !decoded.role || !decoded.id) {
      return res.status(401).json({ message: "Invalid token structure" });
    }

    console.log("Decoded token:", decoded);

    // Validate role
    if (
      !Object.values(USER_ROLES).includes(
        decoded.role.toLowerCase() as UserRole
      )
    ) {
      throw new AppError("Invalid user role", 401);
    }

    // Normalize role to lowercase
    decoded.role = decoded.role.toLowerCase();
    req.user = decoded as { id: string; email: string; role: string };

    // Forward user email to order service
    if (req.path.startsWith("/api/orders")) {
      req.headers["x-user-email"] = decoded.email;
      console.log("Forwarding user email to order service:", decoded.email);
    }

    next();
  } catch (error) {
    console.error("Auth error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    } else {
      next(error);
    }
  }
};

export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authenticated", 401));
    }

    if (!roles.includes(req.user.role.toLowerCase())) {
      return next(new AppError("Unauthorized - Insufficient permissions", 403));
    }

    next();
  };
};
