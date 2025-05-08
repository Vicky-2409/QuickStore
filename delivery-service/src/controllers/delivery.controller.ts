import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types/express";
import { DeliveryPartnerService } from "../services/delivery-partner.service";
import { OrderService } from "../services/order.service";
import { logger } from "../utils/logger";
import { OrderStatus } from "../types/order.types";
import { Order } from "../models/order.model";
import { publishDeliveryEvent } from "../events";
import { getRabbitMQChannel } from "../config/rabbitmq";

interface User {
  id: string;
  email: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: User;
}

export class DeliveryController {
  constructor(
    private orderService: OrderService,
    private deliveryPartnerService: DeliveryPartnerService
  ) {}

  registerDeliveryPartner = async (req: Request, res: Response) => {
    try {
      const { name, email, phone, vehicleType } = req.body;
      logger.info(`Registering delivery partner: ${email}`);
      // TODO: Implement partner registration logic
      res.status(201).json({ message: "Partner registered successfully" });
    } catch (error) {
      logger.error("Error registering partner:", error);
      res.status(500).json({ message: "Error registering partner" });
    }
  };

  updateAvailability = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { isAvailable } = req.body;
      const partnerId = req.user.id;
      await this.deliveryPartnerService.updatePartnerAvailability(
        partnerId,
        isAvailable
      );
      res.status(200).json({ message: "Availability updated successfully" });
    } catch (error) {
      logger.error("Error updating availability:", error);
      res.status(500).json({ message: "Error updating availability" });
    }
  };

  updateLocation = async (req: Request, res: Response) => {
    try {
      const { partnerId, location } = req.body;
      await this.deliveryPartnerService.updatePartnerLocation(
        partnerId,
        location
      );
      res.status(200).json({ message: "Location updated successfully" });
    } catch (error) {
      logger.error("Error updating location:", error);
      res.status(500).json({ message: "Error updating location" });
    }
  };

  getActivePartners = async (req: Request, res: Response): Promise<void> => {
    try {
      const partners = await this.deliveryPartnerService.getAvailablePartners();
      res.status(200).json(partners);
    } catch (error) {
      logger.error("Error getting active partners:", error);
      res.status(500).json({ message: "Error getting active partners" });
    }
  };

  assignDelivery = async (req: Request, res: Response) => {
    try {
      const { orderId, partnerId } = req.body;
      const order = await this.orderService.assignDeliveryPartner(
        orderId,
        partnerId
      );
      res.status(200).json(order);
    } catch (error) {
      logger.error("Error assigning delivery:", error);
      res.status(500).json({ message: "Error assigning delivery" });
    }
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId, status } = req.body;
      const order = await this.orderService.updateOrderStatus(orderId, status);
      res.status(200).json(order);
    } catch (error) {
      logger.error("Error updating status:", error);
      res.status(500).json({ message: "Error updating status" });
    }
  };

  getDeliveryDetails = async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const order = await this.orderService.getOrder(orderId);
      res.status(200).json(order);
    } catch (error) {
      logger.error("Error getting delivery details:", error);
      res.status(500).json({ message: "Error getting delivery details" });
    }
  };

  getDeliveryHistory = async (req: Request, res: Response) => {
    try {
      const { partnerId } = req.params;
      // TODO: Implement delivery history logic
      res.status(200).json({ message: "Delivery history retrieved" });
    } catch (error) {
      logger.error("Error getting delivery history:", error);
      res.status(500).json({ message: "Error getting delivery history" });
    }
  };

  acceptDelivery = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { orderId } = req.body;
      const partnerId = req.user.id;
      const order = await this.orderService.assignDeliveryPartner(
        orderId,
        partnerId
      );
      res.status(200).json(order);
    } catch (error) {
      logger.error("Error accepting delivery:", error);
      res.status(500).json({ message: "Error accepting delivery" });
    }
  };

  getUnassignedOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const orders = await this.orderService.getPendingOrders();
      res.status(200).json(orders);
    } catch (error) {
      logger.error("Error getting unassigned orders:", error);
      res.status(500).json({ message: "Error getting unassigned orders" });
    }
  };

  createOrder = async (req: Request, res: Response) => {
    try {
      const order = await this.orderService.createOrder(req.body);
      res.status(201).json(order);
    } catch (error) {
      logger.error("Error creating order:", error);
      res.status(500).json({ message: "Error creating order" });
    }
  };

  getOrder = async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const order = await this.orderService.getOrder(orderId);
      res.status(200).json(order);
    } catch (error) {
      logger.error("Error getting order:", error);
      res.status(500).json({ message: "Error getting order" });
    }
  };

  getPendingOrders = async (req: Request, res: Response) => {
    try {
      const orders = await this.orderService.getPendingOrders();
      res.status(200).json(orders);
    } catch (error) {
      logger.error("Error getting pending orders:", error);
      res.status(500).json({ message: "Error getting pending orders" });
    }
  };

  updateOrderStatus = async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      // Get the RabbitMQ channel
      const channel = getRabbitMQChannel();

      // Publish delivery status update event
      await publishDeliveryEvent(channel, "delivery.status_updated", {
        orderId,
        status,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Updated delivery status for order ${orderId} to ${status}`);
      const order = await this.orderService.updateOrderStatus(orderId, status);
      res.status(200).json(order);
    } catch (error) {
      logger.error("Error updating order status:", error);
      res.status(500).json({ message: "Error updating order status" });
    }
  };

  assignDeliveryPartner = async (req: Request, res: Response) => {
    try {
      const { orderId, partnerId } = req.body;
      const order = await this.orderService.assignDeliveryPartner(
        orderId,
        partnerId
      );
      res.status(200).json(order);
    } catch (error) {
      logger.error("Error assigning delivery partner:", error);
      res.status(500).json({ message: "Error assigning delivery partner" });
    }
  };

  getAvailablePartners = async (req: Request, res: Response) => {
    try {
      const partners = await this.deliveryPartnerService.getAvailablePartners();
      res.status(200).json(partners);
    } catch (error) {
      logger.error("Error getting available partners:", error);
      res.status(500).json({ message: "Error getting available partners" });
    }
  };

  updatePartnerAvailability = async (req: Request, res: Response) => {
    try {
      const { partnerId, available } = req.body;
      const partner =
        await this.deliveryPartnerService.updatePartnerAvailability(
          partnerId,
          available
        );
      res.status(200).json(partner);
    } catch (error) {
      logger.error("Error updating partner availability:", error);
      res.status(500).json({ message: "Error updating partner availability" });
    }
  };

  async updateSocketIds(req: Request, res: Response) {
    try {
      const { orderId, customerSocketId, deliveryPartnerSocketId } = req.body;
      await this.orderService.updateSocketIds(
        orderId,
        customerSocketId,
        deliveryPartnerSocketId
      );
      res.status(200).json({ message: "Socket IDs updated successfully" });
    } catch (error) {
      logger.error("Error updating socket IDs:", error);
      res.status(500).json({ message: "Error updating socket IDs" });
    }
  }

  async updatePartnerLocation(req: Request, res: Response) {
    try {
      const { partnerId, location } = req.body;
      await this.deliveryPartnerService.updatePartnerLocation(
        partnerId,
        location
      );
      res
        .status(200)
        .json({ message: "Partner location updated successfully" });
    } catch (error) {
      logger.error("Error updating partner location:", error);
      res.status(500).json({ message: "Error updating partner location" });
    }
  }

  handleNewOrder = async (orderData: any) => {
    try {
      const order = await this.orderService.handleNewOrder(orderData);
      return order;
    } catch (error) {
      logger.error("Error handling new order:", error);
      throw error;
    }
  };

  getActiveOrder = async (req: Request, res: Response) => {
    console.log("getActiveOrder");
    try {
      const partnerEmail = req.headers["x-partner-email"] as string;
      if (!partnerEmail) {
        return res.status(400).json({ message: "Partner email is required" });
      }

      const order = await this.orderService.getActiveOrder(partnerEmail);
      if (!order) {
        return res.status(200).json({ message: "No active order found", data: {}
         });
      }

      res.status(200).json(order );
    } catch (error) {
      logger.error("Error getting active order:", error);
      res.status(500).json({ message: "Error getting active order" });
    }
  };

  getAllOrders = async (req: Request, res: Response) => {
    try {
      const orders = await this.orderService.getAllOrders();
      res.status(200).json(orders);
    } catch (error) {
      logger.error("Error getting all orders:", error);
      res.status(500).json({ message: "Error getting all orders" });
    }
  };

  async getOrdersByCustomerEmail(req: Request, res: Response): Promise<void> {
    const { email } = req.params;
    try {
      const orders = await this.orderService.getOrdersByCustomerEmail(email);
      console.log("orders", orders);
      res.status(200).json(orders);
    } catch (error) {
      logger.error(`Error getting orders for customer ${email}:`, error);
      res.status(500).json({ message: "Error getting customer orders" });
    }
  }

  async getCompletedOrders(req: Request, res: Response) {
    try {
      const { deliveryPartnerEmail } = req.query;

      if (!deliveryPartnerEmail) {
        return res
          .status(400)
          .json({ error: "Delivery partner email is required" });
      }

      const orders = await Order.find({
        assignedPartnerId: deliveryPartnerEmail,
        status: "delivered",
      }).sort({ updatedAt: -1 });

      res.json(orders);
    } catch (error) {
      console.error("Error fetching completed orders:", error);
      res.status(500).json({ error: "Failed to fetch completed orders" });
    }
  }
}
