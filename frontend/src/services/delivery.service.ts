import axios from "axios";
import { API_CONFIG } from "@/config";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface DeliveryPartner {
  _id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  isAvailable: boolean;
}

export interface Order {
  orderId: string;
  status: string;
  customerEmail: string;
  customerAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: OrderItem[];
  total: number;
  deliveryPartner?: DeliveryPartner;
  createdAt: string;
  updatedAt: string;
}

class DeliveryService {
  private baseUrl = `${API_CONFIG.BASE_URL}/delivery`;

  async getOrdersByCustomerEmail(email: string): Promise<Order[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/orders/customer/${email}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      throw error;
    }
  }

  async getDeliveryPartner(email: string): Promise<DeliveryPartner> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/partners/email/${email}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching delivery partner:", error);
      throw error;
    }
  }

  async updateDeliveryPartner(
    email: string,
    profile: Partial<DeliveryPartner>
  ): Promise<void> {
    try {
      await axios.put(`${this.baseUrl}/partners/email/${email}`, profile);
    } catch (error) {
      console.error("Error updating delivery partner:", error);
      throw error;
    }
  }

  async getPendingOrders(): Promise<Order[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/orders/pending`, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching pending orders:", error);
      throw error;
    }
  }

  async getOrderById(orderId: string): Promise<Order> {
    try {
      const response = await axios.get(`${this.baseUrl}/orders/${orderId}`, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching order details:", error);
      throw error;
    }
  }

  async acceptOrder(orderId: string, partnerEmail: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/orders/${orderId}/assign`,
        { partnerEmail },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Error accepting order:", error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/orders/${orderId}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }

  async getCompletedOrdersByPartner(email: string): Promise<Order[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/orders/completed`, {
        params: { deliveryPartnerEmail: email },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching completed orders:", error);
      throw error;
    }
  }
}

export const deliveryService = new DeliveryService();
