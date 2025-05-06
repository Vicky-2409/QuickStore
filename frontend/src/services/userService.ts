import axios from "axios";
import { getAccessToken } from "@/utils/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://thestore.pw";

export class UserService {
  static async login(email: string, password: string, role: string) {
    console.log("Login request data:", { email, password, role });
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
      role,
    });
    console.log("Login response:", response.data);
    return response.data;
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

  static async getProfile() {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No token found");
    }
    const response = await axios.get(`${API_URL}/api/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  static async updateProfile(data: {
    name?: string;
    email?: string;
    phone?: string;
    vehicleType?: string;
    vehicleNumber?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  }) {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No token found");
    }
    const response = await axios.patch(`${API_URL}/api/users/profile`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  static async getAddresses() {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No token found");
    }
    const response = await axios.get(`${API_URL}/api/users/address`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  static async addAddress(addressData: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    isDefault: boolean;
  }) {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No token found");
    }
    const response = await axios.post(
      `${API_URL}/api/users/address`,
      addressData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  static async deleteAddress(addressId: string) {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No token found");
    }
    const response = await axios.delete(
      `${API_URL}/api/users/address/${addressId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  static async updateAddress(
    addressId: string,
    addressData: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
      isDefault: boolean;
    }
  ) {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No token found");
    }
    const response = await axios.patch(
      `${API_URL}/api/users/address/${addressId}`,
      addressData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  static async getOrders() {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No token found");
    }
    const response = await axios.get(`${API_URL}/api/users/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  static async getUserByEmail(email: string) {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No token found");
    }
    const response = await axios.get(`${API_URL}/api/users/email/${email}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  }

  static async getWallet() {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No token found");
    }
    const response = await axios.get(`${API_URL}/api/users/wallet`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  static async getWishlist() {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No token found");
    }
    const response = await axios.get(`${API_URL}/api/users/wishlist`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }
}
