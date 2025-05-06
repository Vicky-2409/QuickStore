import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/error-handler";

// Role constants to match frontend
export const USER_ROLES = {
  ADMIN: "admin",
  CUSTOMER: "customer",
  DELIVERY_PARTNER: "delivery_partner",
} as const;

type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

interface JwtPayload {
  id: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as JwtPayload;

    // Validate token expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new AppError("Token expired", 401);
    }

    // Validate role
    if (!Object.values(USER_ROLES).includes(decoded.role)) {
      throw new AppError("Invalid user role", 401);
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError("Token expired", 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError("Invalid token", 401));
    } else {
      next(error);
    }
  }
};

export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== USER_ROLES.ADMIN) {
    return next(new AppError("Admin access required", 403));
  }
  next();
};

export const authorizeCustomer = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== USER_ROLES.CUSTOMER) {
    return next(new AppError("Customer access required", 403));
  }
  next();
};

export const authorizeDeliveryPartner = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== USER_ROLES.DELIVERY_PARTNER) {
    return next(new AppError("Delivery partner access required", 403));
  }
  next();
};
