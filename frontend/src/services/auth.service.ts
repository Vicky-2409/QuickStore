import { UserRole } from "@/enums/user.enum";
import { API_CONFIG } from "@/config/api.config";
import { apiClient, authClient } from "@/lib/api-client";
import {
  setTokens,
  removeTokens,
  setUser,
  removeUser,
  getAccessToken,
  getRefreshToken,
} from "@/utils/auth";
import Cookies from "js-cookie";
import { User } from "@/types/user";
import axios from "axios";

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  vehicleType?: string;
  vehicleNumber?: string;
}

export interface LoginData {
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    email: string;
    name?: string;
    phone?: string;
    role: string;
    isVerified: boolean;
    accessToken: string;
    refreshToken: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class AuthService {
  async registerDeliveryPartner(data: RegisterData) {
    const response = await apiClient.post(`${API_URL}/api/auth/register`, {
      ...data,
      role: "delivery_partner",
    });
    return response.data;
  }

  async registerCustomer(data: Omit<RegisterData, "role">) {
    return this.register({
      ...data,
      role: UserRole.CUSTOMER,
    });
  }

  async register(data: RegisterData) {
    const response = await apiClient.post(`${API_URL}/api/auth/register`, {
      ...data,
      role: data.role.toLowerCase(),
    });
    return response.data;
  }

  async login(data: LoginData): Promise<LoginResponse> {
    try {
      const response = await apiClient.post(`${API_URL}/api/auth/login`, {
        ...data,
        role: data.role?.toLowerCase() || "customer",
      });
      const { success, message, data: userData } = response.data;

      if (
        !success ||
        !userData ||
        !userData.accessToken ||
        !userData.refreshToken
      ) {
        throw new Error("Missing tokens or user data in response");
      }

      // Store tokens and user data in both cookies and localStorage
      setTokens(userData.accessToken, userData.refreshToken);
      setUser(userData);

      // Store in localStorage for Redux
      localStorage.setItem("accessToken", userData.accessToken);
      localStorage.setItem("refreshToken", userData.refreshToken);
      localStorage.setItem("user", JSON.stringify(userData));

      return {
        success,
        message,
        data: userData,
      };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async loginCustomer(data: Omit<LoginData, "role">) {
    return this.login({
      ...data,
      role: UserRole.CUSTOMER,
    });
  }

  async loginAdmin(data: Omit<LoginData, "role">) {
    return this.login({
      ...data,
      role: UserRole.ADMIN,
    });
  }

  async loginDeliveryPartner(data: Omit<LoginData, "role">) {
    return this.login({
      ...data,
      role: UserRole.DELIVERY_PARTNER,
    });
  }

  async verifyOTP(data: { email: string; otp: string; role: UserRole }) {
    const response = await apiClient.post(`${API_URL}/api/auth/verify-otp`, {
      email: data.email,
      otp: data.otp,
      type: data.role,
    });
    return response.data;
  }

  async verifyCustomerOTP(data: { email: string; otp: string }) {
    try {
      const response = await apiClient.post(`${API_URL}/api/auth/verify-otp`, {
        ...data,
        role: UserRole.CUSTOMER,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async verifyDeliveryPartnerOTP(data: { email: string; otp: string }) {
    return this.verifyOTP({
      ...data,
      role: UserRole.DELIVERY_PARTNER,
    });
  }

  async resendOTP(data: { email: string; role: UserRole }) {
    const response = await apiClient.post(`${API_URL}/api/auth/resend-otp`, {
      email: data.email,
      type: data.role,
    });
    return response.data;
  }

  async resendCustomerOTP(email: string) {
    return this.resendOTP({
      email,
      role: UserRole.CUSTOMER,
    });
  }

  async resendDeliveryPartnerOTP(email: string) {
    return this.resendOTP({
      email,
      role: UserRole.DELIVERY_PARTNER,
    });
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = getAccessToken();
      if (!token) return null;

      const response = await apiClient.get(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        // Update stored user data
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
      }

      return response.data.data;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  }

  async getAllUsers() {
    try {
      const response = await apiClient.get(`${API_URL}/api/auth/users`);
      console.log("Users response:", response.data);
      return Array.isArray(response.data.data) ? response.data.data : [];
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  }

  async toggleUserStatus(id: string, active: boolean) {
    const response = await apiClient.patch(
      `${API_URL}/api/auth/users/${id}/status`,
      { active }
    );
    return response.data;
  }

  async refreshToken(): Promise<{ accessToken: string }> {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await apiClient.post(
        `${API_URL}/api/auth/refresh-token`,
        { refreshToken }
      );

      const { accessToken } = response.data;
      if (!accessToken) {
        throw new Error("No access token in response");
      }

      // Update the access token in both cookies and localStorage
      setTokens(accessToken, refreshToken);
      localStorage.setItem("accessToken", accessToken);

      return { accessToken };
    } catch (error) {
      console.error("Token refresh error:", error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const accessToken = getAccessToken();
      if (accessToken) {
        await apiClient.post(
          `${API_URL}/api/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear all auth data from both cookies and localStorage
      removeTokens();
      removeUser();
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  }

  isAuthenticated(): boolean {
    const token = getAccessToken();
    return !!token;
  }

  static async login(email: string, password: string, role: string) {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
      role,
    });
    const { accessToken, refreshToken, ...user } = response.data;
    setTokens(accessToken, refreshToken);
    setUser(user);
    return user;
  }

  static async register(
    email: string,
    password: string,
    name: string,
    role: string
  ) {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email,
      password,
      name,
      role,
    });
    return response.data;
  }

  static async verifyOTP(email: string, otp: string) {
    const response = await axios.post(`${API_URL}/api/auth/verify-otp`, {
      email,
      otp,
    });
    return response.data;
  }

  static async resendOTP(email: string) {
    const response = await axios.post(`${API_URL}/api/auth/resend-otp`, {
      email,
    });
    return response.data;
  }

  static async getCurrentUser() {
    const response = await axios.get(`${API_URL}/api/auth/me`);
    return response.data;
  }
}

export const authService = new AuthService();
