import { Service } from "typedi";
import mongoose, { Schema, Document } from "mongoose";
import { Order, OrderStatus } from "../types/order.types";
import { logger } from "../utils/logger";
import { IOrder } from "../models/order.model";

// Define MongoDB schema
const OrderSchema = new Schema({
  orderId: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ["pending", "assigned", "picked_up", "delivered", "cancelled"],
    default: "pending",
    required: true,
  },
  assignedPartnerId: { type: String, required: false },
  customerSocketId: { type: String, required: false },
  deliveryPartnerSocketId: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Check if model exists before creating it
const OrderModel =
  mongoose.models.Order || mongoose.model("Order", OrderSchema);

@Service()
export class OrderRepository {
  private model = OrderModel;

  async create(orderData: Partial<Order>): Promise<Order> {
    const order = new this.model(orderData);
    return order.save();
  }

  async findById(orderId: string): Promise<Order> {
    const order = await this.model.findOne({ orderId });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    return order;
  }

  async update(orderId: string, updateData: Partial<Order>): Promise<Order> {
    const updatedOrder = await this.model.findOneAndUpdate(
      { orderId },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedOrder) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    return updatedOrder;
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const updatedOrder = await this.model.findOneAndUpdate(
      { orderId },
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedOrder) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    return updatedOrder;
  }

  async assignPartner(orderId: string, partnerId: string): Promise<Order> {
    const updatedOrder = await this.model.findOneAndUpdate(
      { orderId },
      {
        assignedPartnerId: partnerId,
        status: "assigned" as OrderStatus,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedOrder) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    return updatedOrder;
  }

  async updateSocketIds(
    orderId: string,
    customerSocketId?: string,
    deliveryPartnerSocketId?: string
  ): Promise<Order> {
    const updatedOrder = await this.model.findOneAndUpdate(
      { orderId },
      {
        customerSocketId,
        deliveryPartnerSocketId,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedOrder) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    return updatedOrder;
  }

  async findByPartnerId(partnerId: string): Promise<Order[]> {
    try {
      return await this.model.find({ assignedPartnerId: partnerId });
    } catch (error) {
      logger.error(`Error finding orders for partner ${partnerId}:`, error);
      throw error;
    }
  }

  async findUnassigned(): Promise<Order[]> {
    try {
      return await this.model.find({
        assignedPartnerId: null,
        status: "pending",
      });
    } catch (error) {
      logger.error("Error finding unassigned orders:", error);
      throw error;
    }
  }

  async createOrder(orderData: {
    orderId: string;
    customerId: string;
    customerLocation: {
      lat: number;
      lng: number;
    };
  }): Promise<IOrder> {
    try {
      const order = new this.model({
        ...orderData,
        status: "pending",
        assignedPartnerId: null,
      });
      await order.save();
      logger.info(`Created new order: ${order.orderId}`);
      return order;
    } catch (error) {
      logger.error("Error creating order:", error);
      throw error;
    }
  }

  async getOrderById(orderId: string): Promise<IOrder | null> {
    try {
      return await this.model.findOne({ orderId });
    } catch (error) {
      logger.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: IOrder["status"],
    assignedPartnerId?: string
  ): Promise<IOrder> {
    try {
      const updateData: any = { status };
      if (assignedPartnerId) {
        updateData.assignedPartnerId = assignedPartnerId;
      }
      const updatedOrder = await this.model.findOneAndUpdate(
        { orderId },
        { $set: updateData },
        { new: true }
      );

      if (!updatedOrder) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      return updatedOrder;
    } catch (error) {
      logger.error(`Error updating order ${orderId}:`, error);
      throw error;
    }
  }

  async getPendingOrders(): Promise<IOrder[]> {
    return this.model.find({
      status: "pending",
      assignedPartnerId: null,
    });
  }

  async findActiveOrderByPartner(partnerEmail: string): Promise<Order | null> {
    try {
      const order = await this.model.findOne({
        assignedPartnerId: partnerEmail,
        status: { $nin: ["delivered"] },
      });
      console.log("order", order);
      return order;
    } catch (error) {
      logger.error("Error finding active order by partner:", error);
      throw error;
    }
  }

  async getAllOrders(): Promise<IOrder[]> {
    try {
      return await this.model.find().sort({ createdAt: -1 });
    } catch (error) {
      logger.error("Error getting all orders:", error);
      throw error;
    }
  }

  async getOrdersByCustomerEmail(email: string): Promise<IOrder[]> {
    try {
      return await this.model
        .find({ customerEmail: email })
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error(`Error getting orders for customer ${email}:`, error);
      throw error;
    }
  }
}
