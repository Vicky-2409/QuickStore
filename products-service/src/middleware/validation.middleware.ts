import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { AppError } from "../utils/error-handler";

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.type === "field" ? error.path : "unknown",
      message: error.msg,
      value: req.body[error.type === "field" ? error.path : "unknown"],
    }));
    return next(new AppError(JSON.stringify(errorMessages), 400));
  }
  next();
};

export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (page < 1 || limit < 1) {
    return next(new AppError("Invalid pagination parameters", 400));
  }

  req.query.page = page.toString();
  req.query.limit = limit.toString();
  next();
};
