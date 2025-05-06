import { Category } from "../types/category";
import { Product } from "../types/product";
import { API_CONFIG } from "@/config/api.config";
import apiClient from "@/lib/api-client";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "api-gateway-srv";

export const productService = {
  getProducts: async (page: number = 1, limit: number = 12) => {
    return axios.get(`${API_URL}/api/products?page=${page}&limit=${limit}`);
  },

  getProductById: async (id: string) => {
    return axios.get(`${API_URL}/api/products/${id}`);
  },

  createProduct: async (product: FormData) => {
    return apiClient.post(
      API_CONFIG.GATEWAY.ENDPOINTS.PRODUCTS.CREATE,
      product,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  updateProduct: async (id: string, product: FormData) => {
    return apiClient.put(
      API_CONFIG.GATEWAY.ENDPOINTS.PRODUCTS.UPDATE.replace(":id", id),
      product,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  deleteProduct: async (id: string) => {
    return axios.delete(`${API_URL}/api/products/${id}`);
  },

  restoreProduct: async (id: string) => {
    return axios.post(`${API_URL}/api/products/${id}/restore`);
  },

  async getCategories() {
    const response = await apiClient.get(
      API_CONFIG.GATEWAY.ENDPOINTS.CATEGORIES.LIST
    );
    return response.data;
  },

  async getCategory(id: string) {
    const response = await apiClient.get(
      API_CONFIG.GATEWAY.ENDPOINTS.CATEGORIES.DETAIL.replace(":id", id)
    );
    return response.data;
  },

  async createCategory(category: Omit<Category, "id">) {
    const response = await apiClient.post(
      API_CONFIG.GATEWAY.ENDPOINTS.CATEGORIES.CREATE,
      category
    );
    return response.data;
  },

  async updateCategory(id: string, category: FormData | Partial<Category>) {
    const isFormData = category instanceof FormData;
    const response = await apiClient.put(
      API_CONFIG.GATEWAY.ENDPOINTS.CATEGORIES.UPDATE.replace(":id", id),
      category,
      {
        headers: isFormData
          ? {
              "Content-Type": "multipart/form-data",
            }
          : undefined,
      }
    );
    return response.data;
  },

  async deleteCategory(id: string) {
    const response = await apiClient.delete(
      API_CONFIG.GATEWAY.ENDPOINTS.CATEGORIES.DELETE.replace(":id", id)
    );
    return response.data;
  },

  async toggleCategoryStatus(id: string, active: boolean) {
    return this.updateCategory(id, { active });
  },

  async softDeleteCategory(id: string) {
    const response = await apiClient.patch(`/api/categories/${id}/soft-delete`);
    return response.data;
  },

  async restoreCategory(id: string) {
    const response = await apiClient.patch(`/api/categories/${id}/restore`);
    return response.data;
  },

  async toggleProductStatus(id: string, active: boolean) {
    const response = await apiClient.patch(
      API_CONFIG.GATEWAY.ENDPOINTS.PRODUCTS.TOGGLE_STATUS.replace(":id", id),
      { active }
    );
    return response.data;
  },

  async softDeleteProduct(id: string) {
    const response = await apiClient.delete(
      API_CONFIG.GATEWAY.ENDPOINTS.PRODUCTS.SOFT_DELETE.replace(":id", id)
    );
    return response.data;
  },
};
