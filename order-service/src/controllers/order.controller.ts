import { Request, Response } from "express";
import { Service, Inject } from "typedi";
import { IOrderService } from "../interfaces/services/order.service.interface";
import { createOrderSchema } from "../validators/order.validator";
import { ValidationErrorItem } from "joi";
import mongoose from "mongoose";

@Service()
export class OrderController {
  constructor(@Inject("orderService") private orderService: IOrderService) {}

  async createOrder(req: Request, res: Response) {
    try {
      console.log("MongoDB connection state:", mongoose.connection.readyState);

      console.log("Received order creation request:", {
        body: req.body,
        headers: {
          "x-user-email": req.headers["x-user-email"],
          authorization: req.headers["authorization"] ? "Present" : "Missing",
        },
      });

      const { error } = createOrderSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        console.log("Validation error details:", {
          message: error.message,
          details: error.details.map((detail: ValidationErrorItem) => ({
            path: detail.path,
            message: detail.message,
            type: detail.type,
          })),
        });
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((detail: ValidationErrorItem) => ({
            field: detail.path.join("."),
            message: detail.message,
          })),
        });
      }

      // Get user email from body or headers
      const userEmail = req.body.userEmail || req.headers["x-user-email"];
      if (!userEmail) {
        return res.status(400).json({
          success: false,
          message:
            "User email is required. Please provide it in the request body or x-user-email header",
        });
      }

      // Log each item's structure
      console.log(
        "Items validation check:",
        req.body.items?.map((item: any) => ({
          hasProduct: !!item.product,
          productFields: item.product ? Object.keys(item.product) : [],
          hasQuantity: typeof item.quantity === "number",
          quantity: item.quantity,
        }))
      );

      // Log address structure
      console.log("Address validation check:", {
        hasAddress: !!req.body.address,
        addressFields: req.body.address ? Object.keys(req.body.address) : [],
      });

      console.log("Attempting to create order with data:", {
        ...req.body,
        userEmail,
      });

      const order = await this.orderService.createOrder({
        ...req.body,
        userEmail,
      });

      console.log("Order created successfully:", order);

      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        order,
      });
    } catch (error: any) {
      console.error("Error in createOrder:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        keyPattern: error.keyPattern,
        keyValue: error.keyValue,
      });
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async getOrders(req: Request, res: Response) {
    try {
      const userEmail = req.headers["x-user-email"] as string;
      const userRole = req.headers["x-user-role"] as string;

      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: "User email is required",
        });
      }

      let orders;
      if (userRole === "admin") {
        // Admin can see all orders
        orders = await this.orderService.getAllOrders();
      } else {
        // Regular users can only see their orders
        orders = await this.orderService.getOrdersByUserEmail(userEmail);
      }

      res.json({ success: true, orders });
    } catch (error) {
      console.error("Error in getOrders:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching orders",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getAllOrders(req: Request, res: Response) {
    try {
      const orders = await this.orderService.getAllOrders();
      return res.status(200).json({
        success: true,
        orders,
      });
    } catch (error: any) {
      console.error("Error in getAllOrders:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async getOrderById(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const userEmail = req.headers["x-user-email"] as string;
      const userRole = req.headers["x-user-role"] as string;

      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: "User email is required",
        });
      }

      const order = await this.orderService.getOrderById(orderId);

      // Allow access if user is admin, delivery partner, or the order owner
      if (
        userRole === "admin" ||
        userRole === "delivery_partner" ||
        order.userEmail === userEmail
      ) {
        return res.json({ success: true, order });
      }

      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this order",
      });
    } catch (error) {
      console.error("Error in getOrderById:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching order",
      });
    }
  }

  async updateOrderStatus(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      await this.orderService.updateOrderStatus(orderId, status);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error updating order status:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update order status",
      });
    }
  }

  async getUnassignedOrders(req: Request, res: Response) {
    try {
      const orders = await this.orderService.getUnassignedOrders();
      return res.json({ success: true, orders });
    } catch (error) {
      console.error("Error fetching unassigned orders:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch unassigned orders",
      });
    }
  }

  async updatePaymentStatus(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      await this.orderService.updatePaymentStatus(orderId, status);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error updating payment status:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update payment status",
      });
    }
  }
}
