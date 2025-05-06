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

      // Get user email from token
      let userEmail = "";
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        userEmail = payload.email;
      } catch (error) {
        console.error("Error getting user email from token:", error);
        throw new Error("Invalid token format");
      }

      return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-user-email": userEmail,
      };
    } catch (error) {
      console.error("Error getting auth headers:", error);
      throw error;
    }
  }

  async createOrder(data: Omit<CreateOrderDTO, "userEmail">): Promise<Order> {
    try {
      const token = await getValidAccessToken();
      if (!token) {
        throw new Error("No auth token found");
      }

      // Decode the token to get user email
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userEmail = payload.email;

      // Log detailed item structure
      console.log(
        "Items structure check:",
        data.items.map((item) => ({
          product: {
            hasId: !!item.product._id,
            hasName: !!item.product.name,
            hasPrice: typeof item.product.price === "number",
            hasImageUrl: "imageUrl" in item.product,
            fields: Object.keys(item.product),
          },
          hasQuantity: typeof item.quantity === "number",
          quantity: item.quantity,
        }))
      );

      const requestData = { ...data, userEmail };
      console.log("Creating order with data:", requestData);

      const response = await axios.post(`${API_URL}/orders`, requestData, {
        headers: await this.getAuthHeaders(),
      });
      console.log("Order creation response:", response.data);
      return response.data.order;
    } catch (error: any) {
      console.error("Error creating order:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        requestData: data,
      });
      throw error;
    }
  }

  async getOrders(): Promise<Order[]> {
    try {
      const headers = await this.getAuthHeaders();
      console.log("Request headers:", headers);
      const response = await axios.get(`${API_URL}/orders`, {
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
      const response = await axios.get(`${API_URL}/orders/${orderId}`, {
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
        `${API_URL}/orders/${orderId}/status`,
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
    const response = await axios.get(`${API_URL}/orders/${orderId}`, {
      headers: await this.getAuthHeaders(),
    });
    return response.data.order;
  }

  async getPendingOrders(): Promise<Order[]> {
    const response = await axios.get(`${API_URL}/delivery/orders/pending`, {
      headers: await this.getAuthHeaders(),
    });
    return response.data;
  }

  async assignDeliveryPartner(
    orderId: string,
    partnerId: string
  ): Promise<Order> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/delivery/orders/assign`,
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

  async getActiveOrder(partnerEmail: string): Promise<Order | null> {
    try {
      console.log("Fetching active order for partner:", partnerEmail);
      const response = await axios.get(`${API_URL}/delivery/orders/active`, {
        headers: {
          ...(await this.getAuthHeaders()),
          "x-partner-email": partnerEmail,
        },
      });
      console.log("Active order API response:", response.data);

      // If we have an active order, fetch its complete details
      if (response.data.order) {
        console.log(
          "Fetching complete order details for:",
          response.data.order.orderId
        );
        const orderDetails = await this.getOrderById(
          response.data.order.orderId
        );
        console.log("Complete order details:", orderDetails);

        const combinedOrder = {
          ...response.data.order,
          ...orderDetails,
        };
        console.log("Combined order data:", combinedOrder);
        return combinedOrder;
      }

      return null;
    } catch (error) {
      console.error("Error fetching active order:", error);
      return null;
    }
  }
}

export const orderService = OrderService.getInstance();
