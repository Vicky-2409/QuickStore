import { Request, Response, NextFunction } from "express";
import { UserRole } from "../enums/user.enum";
import { AppError } from "../utils/appError";
import { verifyAccessToken } from "../utils/token.utils";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
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
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new AppError("No token provided", 401);

    const decoded = verifyAccessToken(token);
    req.user = decoded as { id: string; email: string; role: UserRole };
    next();
  } catch (error) {
    next(new AppError("Invalid token", 401));
  }
};

export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== UserRole.ADMIN) {
    return next(new AppError("Unauthorized - Admin access required", 403));
  }
  next();
};
