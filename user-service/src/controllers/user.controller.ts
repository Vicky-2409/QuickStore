import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import {
  IAddress,
  IWalletTransaction,
  ICartItem,
} from "../interfaces/user.interface";
import { AppError } from "../utils/appError";
import { IUserDocument } from "../models/user.model";

export class UserController {
  constructor(private readonly userService: UserService) {}

  // Admin methods
  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.userService.getAllUsers();
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  getUserByEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.params;
      const user = await this.userService.getUserByEmail(email);
      res.json({ success: true, data: user });
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
      const user = await this.userService.toggleUserStatus(id, active);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await this.userService.getAllUsers();
      const customers = users.filter((user) => user.role === "customer");
      res.json({ success: true, data: customers });
    } catch (error) {
      next(error);
    }
  }

  // Customer methods
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.email) {
        throw new AppError("User not authenticated", 401);
      }
      const user = await this.userService.getUserByEmail(req.user.email);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.email) {
        throw new AppError("User not authenticated", 401);
      }
      const user = await this.userService.updateUserByEmail(
        req.user.email,
        req.body
      );
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  // Address methods
  getAddresses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.email) {
        throw new AppError("User not authenticated", 401);
      }
      const addresses = await this.userService.getAddresses(req.user.email);
      res.json({ success: true, data: addresses });
    } catch (error) {
      next(error);
    }
  };

  addAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.email) {
        throw new AppError("User not authenticated", 401);
      }
      const address = await this.userService.addAddress(
        req.user.email,
        req.body
      );
      res.json({ success: true, data: address });
    } catch (error) {
      next(error);
    }
  };

  updateAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.email) {
        throw new AppError("User not authenticated", 401);
      }
      const { addressId } = req.params;
      const address = await this.userService.updateAddress(
        req.user.email,
        addressId,
        req.body
      );
      res.json({ success: true, data: address });
    } catch (error) {
      next(error);
    }
  };

  deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.email) {
        throw new AppError("User not authenticated", 401);
      }
      const { addressId } = req.params;
      console.log("Deleting address with ID:", addressId);
      if (!addressId) {
        throw new AppError("Address ID is required", 400);
      }
      await this.userService.deleteAddress(req.user.email, addressId);
      res.json({ success: true, message: "Address deleted successfully" });
    } catch (error) {
      console.error("Error deleting address:", error);
      next(error);
    }
  };

  // Wallet methods
  addWalletTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user?.email) {
        throw new AppError("User not authenticated", 401);
      }
      const transaction = await this.userService.addWalletTransaction(
        req.user.email,
        req.body
      );
      res.json({ success: true, data: transaction });
    } catch (error) {
      next(error);
    }
  };

  // Cart methods
  addToCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.email) {
        throw new AppError("User not authenticated", 401);
      }
      const { productId, quantity } = req.body;
      if (!productId || !quantity) {
        throw new AppError("Product ID and quantity are required", 400);
      }
      const user = await this.userService.updateCart(req.user.email, {
        productId,
        quantity,
      });
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  getCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.email) {
        throw new AppError("User not authenticated", 401);
      }
      const user = await this.userService.getCart(req.user.email);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  updateCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.email) {
        throw new AppError("User not authenticated", 401);
      }
      const cart = await this.userService.updateCart(req.user.email, req.body);
      res.json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  };

  removeFromCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.email) {
        throw new AppError("User not authenticated", 401);
      }
      const { productId } = req.params;
      const cart = await this.userService.removeFromCart(
        req.user.email,
        productId
      );
      res.json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  };

  clearCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.email) {
        throw new AppError("User not authenticated", 401);
      }
      const user = await this.userService.clearCart(req.user.email);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };
}
