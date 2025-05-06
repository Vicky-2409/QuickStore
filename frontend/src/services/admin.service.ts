import { authClient, productsClient } from "@/lib/api-client";
import { OrderStats, UserStats, Order } from "@/types/order.types";
import { Product } from "@/types/product";
import { API_CONFIG } from "@/config/api.config";
import { apiClient } from "@/lib/api-client";
import axios from "axios";
import { getAccessToken } from "@/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://thestore.pw";

// Add request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AdminLoginData {
  email: string;
  password: string;
}

export interface AdminResponse {
  _id: string;
  email: string;
  name: string;
  role: string;
  token: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalDeliveryPartners: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: any[];
  recentUsers: any[];
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isVerified: boolean;
}

export interface DeliveryPartner {
  _id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  isVerified: boolean;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  imageUrl?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryData {
  name: string;
  description: string;
  active?: boolean;
  image?: File;
}

export class AdminService {
  // Authentication
  async login(data: AdminLoginData): Promise<AdminResponse> {
    try {
      const response = await authClient.post("/login", data);
      return response.data;
    } catch (error: unknown) {
      console.error("Admin login error:", error);
      throw error;
    }
  }

  // Dashboard & Statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log("Fetching dashboard stats...");
      const response = await apiClient.get("/api/admin/dashboard/stats");
      console.log("Dashboard stats response:", response);
      return {
        totalUsers: response.data.totalUsers || 0,
        totalDeliveryPartners: response.data.totalDeliveryPartners || 0,
        totalOrders: response.data.totalOrders || 0,
        totalRevenue: response.data.totalRevenue || 0,
        recentOrders: response.data.recentOrders || [],
        recentUsers: response.data.recentUsers || [],
      };
    } catch (error: unknown) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  }

  async getOrderStats(): Promise<OrderStats> {
    try {
      const response = await authClient.get("/admin/orders/stats");
      return response.data;
    } catch (error: unknown) {
      console.error("Error fetching order stats:", error);
      throw error;
    }
  }

  async getUserStats(): Promise<UserStats> {
    try {
      const response = await authClient.get("/admin/users/stats");
      return response.data;
    } catch (error: unknown) {
      console.error("Error fetching user stats:", error);
      throw error;
    }
  }

  // User Management
  async getUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get("/api/users");
      console.log("Users response:", response);
      return response?.data?.data;
    } catch (error: unknown) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  async updateUserStatus(userId: string, isBlocked: boolean) {
    try {
      const response = await authClient.patch(`/admin/users/${userId}/status`, {
        isBlocked,
      });
      return response.data;
    } catch (error: unknown) {
      console.error("Error updating user status:", error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      const response = await authClient.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error: unknown) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  // Delivery Partner Management
  async getDeliveryPartners(): Promise<DeliveryPartner[]> {
    try {
      const response = await authClient.get("/admin/delivery-partners");
      return response.data;
    } catch (error: unknown) {
      console.error("Error fetching delivery partners:", error);
      throw error;
    }
  }

  // Product Management
  async createProduct(formData: FormData): Promise<Product> {
    try {
      const response = await productsClient.post(
        API_CONFIG.GATEWAY.ENDPOINTS.PRODUCTS.CREATE,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  async updateProduct(id: string, formData: FormData): Promise<Product> {
    try {
      console.log("Updating product with ID:", id);
      const response = await productsClient.put(
        API_CONFIG.GATEWAY.ENDPOINTS.PRODUCTS.UPDATE.replace(":id", id),
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Update response:", response);
      return response.data;
    } catch (error: unknown) {
      console.error("Error updating product:", error);
      throw error;
    }
  }

  async toggleProductStatus(id: string, active: boolean): Promise<Product> {
    try {
      console.log("Toggling product status:", { id, active });
      const response = await productsClient.patch(
        API_CONFIG.GATEWAY.ENDPOINTS.PRODUCTS.TOGGLE_STATUS.replace(":id", id),
        { active }
      );
      console.log("Toggle status response:", response);
      return response.data;
    } catch (error: unknown) {
      console.error("Error toggling product status:", error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await productsClient.delete(
        API_CONFIG.GATEWAY.ENDPOINTS.PRODUCTS.DELETE.replace(":id", id)
      );
    } catch (error: unknown) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }

  async restoreProduct(id: string): Promise<Product> {
    try {
      console.log("Restoring product with ID:", id);
      const endpoint = API_CONFIG.GATEWAY.ENDPOINTS.PRODUCTS.RESTORE.replace(
        ":id",
        id
      );
      console.log("Using endpoint:", endpoint);
      const response = await productsClient.post(endpoint);
      console.log("Restore response:", response);
      return response.data;
    } catch (error: unknown) {
      console.error("Error restoring product:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      throw error;
    }
  }

  async getProducts(page: number = 1, limit: number = 100): Promise<Product[]> {
    try {
      console.log(
        "Using endpoint:",
        API_CONFIG.GATEWAY.ENDPOINTS.PRODUCTS.LIST
      );
      const response = await productsClient.get(
        API_CONFIG.GATEWAY.ENDPOINTS.PRODUCTS.LIST,
        {
          params: {
            page,
            limit,
          },
        }
      );
      console.log("Raw response:", response);
      // Extract products array from the nested response structure
      const products = response.data?.data || [];
      console.log("Extracted products:", products);
      return Array.isArray(products) ? products : [];
    } catch (error: unknown) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<Product> {
    try {
      const response = await productsClient.get(
        API_CONFIG.GATEWAY.ENDPOINTS.PRODUCTS.DETAIL.replace(":id", id)
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Error fetching product:", error);
      throw error;
    }
  }

  // Category Management
  async getCategories(): Promise<Category[]> {
    try {
      const response = await productsClient.get("/api/categories");
      return response.data;
    } catch (error: unknown) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }

  async createCategory(formData: FormData): Promise<Category> {
    try {
      const response = await productsClient.post("/api/categories", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: unknown) {
      console.error("Error creating category:", error);
      throw error;
    }
  }

  async updateCategory(
    id: string,
    data: CreateCategoryData
  ): Promise<Category> {
    try {
      const response = await productsClient.put(`/api/categories/${id}`, data);
      return response.data;
    } catch (error: unknown) {
      console.error("Error updating category:", error);
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      await productsClient.delete(`/api/categories/${id}`);
    } catch (error: unknown) {
      console.error("Error deleting category:", error);
      throw error;
    }
  }

  async getCategoryById(id: string): Promise<Category> {
    try {
      const response = await productsClient.get(`/api/categories/${id}`);
      return response.data;
    } catch (error: unknown) {
      console.error("Error fetching category:", error);
      throw error;
    }
  }

  // Recent Activity
  async getRecentOrders() {
    try {
      const response = await authClient.get("/admin/orders/recent");
      return response.data;
    } catch (error: unknown) {
      console.error("Error fetching recent orders:", error);
      throw error;
    }
  }

  async getRecentUsers() {
    try {
      const response = await authClient.get("/admin/recent-users");
      return response.data;
    } catch (error: unknown) {
      console.error("Error fetching recent users:", error);
      throw error;
    }
  }

  async getTopProducts() {
    try {
      const response = await productsClient.get("/products/top");
      return response.data;
    } catch (error: unknown) {
      console.error("Error fetching top products:", error);
      throw error;
    }
  }

  async getAllOrders() {
    try {
      const response = await apiClient.get(`/api/orders/all`);
      return response.data?.orders;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  }

  async getAllOrdersFromDeliveryService() {
    try {
      const response = await apiClient.get(`/api/delivery/orders`);
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: string) {
    try {
      const response = await axios.put(
        `${API_URL}/api/delivery/orders/${orderId}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }

  async assignDeliveryPartner(orderId: string, deliveryPartnerId: string) {
    try {
      const response = await axios.post(
        `${API_URL}/api/delivery/orders/assign`,
        { orderId, deliveryPartnerId }
      );
      return response.data;
    } catch (error) {
      console.error("Error assigning delivery partner:", error);
      throw error;
    }
  }
}

// Create and export an instance of the AdminService
export const adminService = new AdminService();
