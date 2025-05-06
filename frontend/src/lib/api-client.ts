import axios from "axios";
import { getAccessToken } from "@/utils/auth";
import { authService } from "@/services/auth.service";
import { API_CONFIG } from "@/config/api.config";

const baseConfig = {
  headers: {
    "Content-Type": "application/json",
  },
};

const gatewayBaseURL = API_CONFIG.GATEWAY.BASE_URL;

// Create base client
export const apiClient = axios.create({
  baseURL: gatewayBaseURL,
  ...baseConfig,
});

// Create auth client
export const authClient = axios.create({
  baseURL: gatewayBaseURL,
  ...baseConfig,
});

// Create products client
export const productsClient = axios.create({
  baseURL: gatewayBaseURL,
  ...baseConfig,
});

// Request interceptor for apiClient
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Request interceptor for productsClient
productsClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for apiClient
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const { accessToken } = await authService.refreshToken();

        // Update the request header with the new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear auth data and redirect to login
        authService.logout();

        // Only redirect if we're on a protected page
        const currentPath = window.location.pathname;
        if (currentPath.startsWith("/admin")) {
          window.location.href = "/admin/login";
        } else if (currentPath.startsWith("/customer")) {
          window.location.href = "/customer/login";
        } else if (currentPath.startsWith("/delivery-partner")) {
          window.location.href = "/delivery-partner/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

// Response interceptor for productsClient
productsClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const { accessToken } = await authService.refreshToken();

        // Update the request header with the new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Retry the original request
        return productsClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear auth data and redirect to login
        authService.logout();

        // Only redirect if we're on a protected page
        const currentPath = window.location.pathname;
        if (currentPath.startsWith("/admin")) {
          window.location.href = "/admin/login";
        } else if (currentPath.startsWith("/customer")) {
          window.location.href = "/customer/login";
        } else if (currentPath.startsWith("/delivery-partner")) {
          window.location.href = "/delivery-partner/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
