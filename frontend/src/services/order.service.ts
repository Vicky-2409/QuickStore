import axios from "axios";
import { getValidAccessToken } from "@/utils/auth";
import { Order, OrderStatus } from "@/types/order.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://thestore.pw";

export interface OrderItem {
  product: {
    _id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
  quantity: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CreateOrderDTO {
  items: OrderItem[];
  total: number;
  address: Address;
  userEmail: string;
}

export type { Order } from "@/types/order.types";

export class OrderService {
  private static instance: OrderService;
  private constructor() {}

  static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  private async getAuthHeaders() {
    try {
      const token = await getValidAccessToken();
      if (!token) {
        throw new Error("No valid access token available");
      }

      // Get user email and role from token
      let userEmail = "";
      let userRole = "";
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        userEmail = payload.email;
        userRole = payload.role;
      } catch (error) {
        console.error("Error getting user data from token:", error);
        throw new Error("Invalid token format");
      }

      return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-user-email": userEmail,
        "x-user-role": userRole,
      };
    } catch (error) {
      console.error("Error getting auth headers:", error);
      throw error;
    }
  }

  async createOrder(data: CreateOrderDTO): Promise<Order> {
    try {
      const response = await axios.post(`${API_URL}/api/orders`, data, {
        headers: await this.getAuthHeaders(),
      });
      return response.data.order;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  async getOrders(): Promise<Order[]> {
    try {
      const headers = await this.getAuthHeaders();
      console.log("Request headers:", headers);
      const response = await axios.get(`${API_URL}/api/orders`, {
        headers,
      });
      console.log("Response:", response.data);
      return response.data.orders;
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (axios.isAxiosError(error)) {
        console.error("Error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
        });
      }
      throw error;
    }
  }

  async getOrderById(orderId: string): Promise<Order> {
    try {
      console.log("Fetching order by ID:", orderId);
      const response = await axios.get(`${API_URL}/api/orders/${orderId}`, {
        headers: await this.getAuthHeaders(),
      });
      console.log("Order details response:", response.data);
      return response.data.order;
    } catch (error) {
      console.error("Error fetching order:", error);
      throw error;
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<Order> {
    try {
      const response = await axios.put(
        `${API_URL}/api/orders/${orderId}/status`,
        { status },
        {
          headers: await this.getAuthHeaders(),
        }
      );
      return response.data.order;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }

  async getOrder(orderId: string): Promise<Order> {
    const response = await axios.get(`${API_URL}/api/orders/${orderId}`, {
      headers: await this.getAuthHeaders(),
    });
    return response.data.order;
  }

  async getPendingOrders(): Promise<Order[]> {
    try {
      const response = await axios.get(
        `${API_URL}/api/delivery/order/pending`,
        {
          headers: await this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching pending orders:", error);
      throw error;
    }
  }

  async assignDeliveryPartner(
    orderId: string,
    partnerId: string
  ): Promise<Order> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/api/delivery/order/assign`,
        {
          orderId,
          partnerId,
        },
        { headers }
      );

      console.log("Assign delivery partner response:", response.data);

      if (!response.data || !response.data.orderId) {
        throw new Error("Invalid response from server");
      }

      // Get the full order details
      const orderDetails: any = await this.getOrderById(response.data.orderId);

      // Restructure the response to match the Order interface
      const order: Order = {
        _id: orderDetails._id,
        orderId: orderDetails._id, // Using _id as orderId if not available
        userId: "", // This might need to be extracted or derived from another field
        items: orderDetails.items || [],
        totalAmount: orderDetails.total || 0,
        status: response.data.status || "assigned",
        customerName: "", // Extract from user details if available
        customerEmail: orderDetails.userEmail || response.data.customerEmail,
        customerAddress: {
          street:
            orderDetails.address?.street ||
            response.data.customerAddress?.street ||
            "",
          city:
            orderDetails.address?.city ||
            response.data.customerAddress?.city ||
            "",
          state:
            orderDetails.address?.state ||
            response.data.customerAddress?.state ||
            "",
          zipCode:
            orderDetails.address?.zipCode ||
            response.data.customerAddress?.zipCode ||
            "",
          country:
            orderDetails.address?.country ||
            response.data.customerAddress?.country ||
            "",
        },
        assignedPartnerId: response.data.assignedPartnerId || partnerId,
        createdAt:
          orderDetails.createdAt ||
          response.data.createdAt ||
          new Date().toISOString(),
        updatedAt:
          orderDetails.updatedAt ||
          response.data.updatedAt ||
          new Date().toISOString(),
      };

      console.log("Order assigned to delivery partner:", order);
      return order;
    } catch (error) {
      console.error("Error assigning delivery partner:", error);
      throw error;
    }
  }

  async getActiveOrder(email: string): Promise<Order> {
    try {
      const response = await axios.get(`${API_URL}/api/delivery/order/active`, {
        headers: {
          ...(await this.getAuthHeaders()),
          "x-partner-email": email,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching active order:", error);
      throw error;
    }
  }
}

export const orderService = OrderService.getInstance();
