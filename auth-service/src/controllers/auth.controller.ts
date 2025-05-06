import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import {
  IUserCreate,
  IUserLogin,
  IUserVerifyOTP,
} from "../interfaces/user.interface";
import { AppError } from "../utils/appError";
import { sendSuccess } from "../utils/sendResponse";

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.authService.register(req.body);
      sendSuccess(res, user, "User registered successfully");
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const loginData: IUserLogin = req.body;
      console.log("Login attempt with data:", {
        email: loginData.email,
        role: loginData.role || loginData.type,
      });

      const result = await this.authService.login(loginData);
      console.log("Login successful for user:", result.email);

      sendSuccess(res, result, "Login successful");
    } catch (error) {
      console.error("Login controller error:", error);
      next(error);
    }
  };

  verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verifyData: IUserVerifyOTP = req.body;
      const result = await this.authService.verifyOTP(verifyData);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("OTP verification error in controller:", error);
      if (error.message === "Invalid OTP") {
        res.status(400).json({
          success: false,
          message: "Invalid OTP. Please check and try again.",
        });
      } else if (error.message === "OTP expired") {
        res.status(400).json({
          success: false,
          message: "OTP has expired. Please request a new one.",
        });
      } else if (error.message === "User not found") {
        res.status(404).json({
          success: false,
          message: "User not found. Please register first.",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "An error occurred while verifying OTP. Please try again.",
        });
      }
    }
  };

  resendOTP = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, type } = req.body;
      await this.authService.resendOTP(email, type);
      sendSuccess(res, null, "OTP sent successfully");
    } catch (error) {
      next(error);
    }
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.email) {
        throw new AppError("User not authenticated", 401);
      }
      const user = await this.authService.getCurrentUser(req.user.email);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.authService.getAllUsers();
      sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  };

  toggleUserStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { active } = req.body;
      console.log("toggleUserStatus", id, active);

      if (typeof active !== "boolean") {
        throw new AppError("active must be a boolean", 400);
      }

      const user = await this.authService.toggleUserStatus(id, active);
      sendSuccess(res, user, "User status updated successfully");
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new AppError("Refresh token is required", 400);
      }

      const result = await this.authService.refreshToken(refreshToken);
      sendSuccess(res, result, "Token refreshed successfully");
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userEmail = req.user?.email;
      if (!userEmail) {
        throw new AppError("User not authenticated", 401);
      }

      await this.authService.logout(userEmail);
      sendSuccess(res, null, "Logged out successfully");
    } catch (error) {
      next(error);
    }
  };
}
