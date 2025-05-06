export const API_CONFIG = {
  GATEWAY: {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
    ENDPOINTS: {
      // Auth endpoints
      AUTH: {
        REGISTER: "/api/auth/register",
        LOGIN: "/api/auth/login",
        VERIFY_OTP: "/api/auth/verify-otp",
        RESEND_OTP: "/api/auth/resend-otp",
        ME: "/api/auth/me",
        REFRESH_TOKEN: "/api/auth/refresh-token",
        LOGOUT: "/api/auth/logout",
        TOGGLE_STATUS: "/api/auth/users/:id/status",
        LIST: "/api/auth/users",
      },
      // User endpoints
      USERS: {
        LIST: "/api/users",
        DETAIL: "/api/users/:id",
        TOGGLE_STATUS: "/api/users/:id/status",
      },
      // Product endpoints
      PRODUCTS: {
        LIST: "/api/products",
        DETAIL: "/api/products/:id",
        CREATE: "/api/products",
        UPDATE: "/api/products/:id",
        DELETE: "/api/products/:id",
        TOGGLE_STATUS: "/api/products/:id/status",
        SOFT_DELETE: "/api/products/:id/soft",
        RESTORE: "/api/products/:id/restore",
      },
      // Category endpoints
      CATEGORIES: {
        LIST: "/api/categories",
        DETAIL: "/api/categories/:id",
        CREATE: "/api/categories",
        UPDATE: "/api/categories/:id",
        DELETE: "/api/categories/:id",
      },
      // Order endpoints
      ORDERS: {
        PLACE: "/api/orders",
        LIST: "/api/orders",
        DETAIL: "/api/orders/:id",
        UPDATE: "/api/orders/:id",
        UPDATE_STATUS: "/api/orders/:id/status",
        ASSIGN_DELIVERY_PARTNER: "/api/orders/:id/assign-delivery-partner",
      },
      ADMIN: {
        DASHBOARD: "/api/admin/dashboard",
        STATS: "/api/admin/stats",
        USERS: "/api/admin/users",
        ORDERS: "/api/admin/orders",
      },
    },
  },
};
