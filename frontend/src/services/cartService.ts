import axios, { AxiosError } from "axios";
import { getAccessToken } from "@/utils/auth";
import { Product } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const cartService = {
  addToCart: async (productId: string, quantity: number) => {
    try {
      const response = await apiClient.post("/api/users/cart", {
        productId,
        quantity,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Failed to add item to cart"
        );
      }
      throw error;
    }
  },

  getCart: async () => {
    try {
      const [cartResponse, productsResponse] = await Promise.all([
        apiClient.get("/api/users/cart"),
        apiClient.get("/api/products"),
      ]);

      // Get the cart items from the user data
      const cartItems = cartResponse.data.data?.cart || [];
      const products = productsResponse.data.data || [];

      // Debug logging
      console.log("Cart Items:", cartItems);
      console.log("Products Response:", productsResponse.data);
      console.log("Products:", products);

      if (!products || products.length === 0) {
        console.error("No products found in the products service response");
      }

      // Map cart items with product details
      const cartWithProducts = cartItems
        .map((item: any) => {
          // Convert both IDs to strings for comparison
          const cartProductId = item.productId.toString();
          const product = products.find((p: Product) => {
            const productId = p._id.toString();
            console.log(
              `Comparing cart ID: ${cartProductId} with product ID: ${productId}`
            );
            return productId === cartProductId;
          });

          if (!product) {
            console.warn(
              `Product with ID ${cartProductId} not found. Available product IDs:`,
              products.map((p: Product) => p._id.toString())
            );
            return null;
          }
          return {
            product,
            quantity: item.quantity,
          };
        })
        .filter(Boolean); // Remove any null items

      if (cartWithProducts.length === 0 && cartItems.length > 0) {
        console.error("No products found for cart items:", cartItems);
        throw new Error("Failed to match cart items with products");
      }

      return {
        success: true,
        data: {
          cart: cartWithProducts,
          total: cartWithProducts.reduce(
            (sum: number, item: any) =>
              sum + item.product.price * item.quantity,
            0
          ),
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Cart service error:", error.response?.data);
        throw new Error(
          error.response?.data?.message || "Failed to fetch cart"
        );
      }
      console.error("Cart service error:", error);
      throw error;
    }
  },

  updateCartItem: async (productId: string, quantity: number) => {
    try {
      const response = await apiClient.patch("/api/users/cart", {
        productId,
        quantity,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Failed to update cart item"
        );
      }
      throw error;
    }
  },

  removeFromCart: async (productId: string) => {
    try {
      const response = await apiClient.delete(`/api/users/cart/${productId}`);
      // After removing, fetch the updated cart
      const updatedCart = await cartService.getCart();
      return {
        success: true,
        data: {
          cart: updatedCart.data.cart,
          total: updatedCart.data.total,
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Failed to remove item from cart"
        );
      }
      throw error;
    }
  },

  clearCart: async () => {
    try {
      const response = await apiClient.delete("/api/users/cart");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Failed to clear cart"
        );
      }
      throw error;
    }
  },
};
