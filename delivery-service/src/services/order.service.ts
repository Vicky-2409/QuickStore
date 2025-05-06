import { Service } from "typedi";
import { OrderRepository } from "../repositories/order.repository";
import { Order, OrderStatus } from "../types/order.types";
import { logger } from "../utils/logger";
import { publishDeliveryEvent } from "../events";
import { getRabbitMQChannel } from "../config/rabbitmq";
import { IOrder } from "../models/order.model";
import { Server } from "socket.io";

@Service()
export class OrderService {
  private io: Server | null = null;

  constructor(private repository: OrderRepository) {}

  setSocketServer(io: Server) {
    this.io = io;
  }

  async createOrder(orderData: {
    orderId: string;
    customerEmail: string;
    customerAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    amount: number;
    status: string;
  }): Promise<IOrder> {
    try {
      return await this.repository.createOrder({
        orderId: orderData.orderId,
        customerId: orderData.customerEmail,
        customerLocation: {
          lat: 0, // TODO: Get actual coordinates
          lng: 0,
        },
      });
    } catch (error) {
      logger.error("Error creating order:", error);
      throw error;
    }
  }

  async getOrder(orderId: string): Promise<IOrder> {
    try {
      const order = await this.repository.getOrderById(orderId);
      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }
      return order;
    } catch (error) {
      logger.error(`Error getting order ${orderId}:`, error);
      throw error;
    }
  }

  async getPendingOrders(): Promise<IOrder[]> {
    try {
      return await this.repository.getPendingOrders();
    } catch (error) {
      logger.error("Error getting pending orders:", error);
      throw error;
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    assignedPartnerId?: string
  ): Promise<IOrder> {
    try {
      const updatedOrder = await this.repository.updateOrderStatus(
        orderId,
        status,
        assignedPartnerId
      );

      if (!updatedOrder) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      if (this.io) {
        // Notify relevant parties about order status update
        this.io.emit(`order:${orderId}:status_update`, {
          orderId,
          status,
          assignedPartnerId,
        });
      }

      return updatedOrder;
    } catch (error) {
      logger.error(`Error updating order status for ${orderId}:`, error);
      throw error;
    }
  }

  async assignDeliveryPartner(
    orderId: string,
    partnerId: string
  ): Promise<IOrder> {
    try {
      const order = await this.repository.updateOrderStatus(
        orderId,
        "assigned",
        partnerId
      );
      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }
      return order;
    } catch (error) {
      logger.error(`Error assigning partner to order ${orderId}:`, error);
      throw error;
    }
  }

  async updateDeliveryStatus(orderId: string, status: OrderStatus) {
    try {
      await this.repository.updateOrderStatus(orderId, status);

      // Publish delivery status update event
      await publishDeliveryEvent(
        getRabbitMQChannel(),
        "delivery.status_updated",
        {
          orderId,
          status,
        }
      );

      logger.info(`Updated delivery status for order ${orderId} to ${status}`);
    } catch (error) {
      logger.error(
        `Error updating delivery status for order ${orderId}:`,
        error
      );
      throw error;
    }
  }

  async cancelOrder(orderId: string) {
    try {
      await this.repository.updateOrderStatus(orderId, "cancelled");
      logger.info(`Cancelled order ${orderId}`);
    } catch (error) {
      logger.error(`Error cancelling order ${orderId}:`, error);
      throw error;
    }
  }

  async handleNewOrder(orderData: {
    orderId: string;
    customerEmail: string;
    customerAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    amount: number;
    status: string;
  }): Promise<IOrder> {
    try {
      const order = await this.createOrder(orderData);
      if (this.io) {
        this.io.emit("new_order", order);
      }
      return order;
    } catch (error) {
      logger.error("Error handling new order:", error);
      throw error;
    }
  }

  async updateSocketIds(
    orderId: string,
    customerSocketId: string,
    deliveryPartnerSocketId: string
  ): Promise<void> {
    try {
      await this.repository.updateSocketIds(
        orderId,
        customerSocketId,
        deliveryPartnerSocketId
      );
      logger.info(`Updated socket IDs for order ${orderId}`);
    } catch (error) {
      logger.error(`Error updating socket IDs for order ${orderId}:`, error);
      throw error;
    }
  }

  async getActiveOrder(partnerEmail: string): Promise<Order | null> {
    try {
      const order = await this.repository.findActiveOrderByPartner(
        partnerEmail
      );
      return order;
    } catch (error) {
      logger.error("Error getting active order:", error);
      throw error;
    }
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const order = await this.repository.getOrderById(orderId);
      return order;
    } catch (error) {
      logger.error(`Error getting order ${orderId}:`, error);
      throw error;
    }
  }

  async getAllOrders(): Promise<IOrder[]> {
    try {
      return await this.repository.getAllOrders();
    } catch (error) {
      logger.error("Error getting all orders:", error);
      throw error;
    }
  }

  async getOrdersByCustomerEmail(email: string): Promise<IOrder[]> {
    try {
      return await this.repository.getOrdersByCustomerEmail(email);
    } catch (error) {
      logger.error(`Error getting orders for customer ${email}:`, error);
      throw error;
    }
  }
}
