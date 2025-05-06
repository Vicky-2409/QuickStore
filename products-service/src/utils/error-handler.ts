import { Request, Response, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError | any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    try {
      // Try to parse the error message as JSON (for validation errors)
      const parsedError = JSON.parse(err.message);
      return res.status(err.statusCode).json({
        status: err.status,
        message: "Validation Error",
        errors: parsedError,
      });
    } catch (e) {
      // If not JSON, return as regular error
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
  }

  // Handle Mongoose errors
  if (err instanceof MongooseError.CastError) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid ID format",
    });
  }

  if (err instanceof MongooseError.ValidationError) {
    return res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }

  // Default error
  console.error("Error:", err);
  return res.status(500).json({
    status: "error",
    message: "Something went wrong",
  });
};
