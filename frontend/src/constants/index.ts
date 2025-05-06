// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
  },
  PRODUCTS: {
    LIST: "/products",
    DETAIL: "/products/:id",
    CREATE: "/products",
    UPDATE: "/products/:id",
    DELETE: "/products/:id",
  },
  CATEGORIES: {
    LIST: "/categories",
    DETAIL: "/categories/:id",
    CREATE: "/categories",
    UPDATE: "/categories/:id",
    DELETE: "/categories/:id",
  },
};

// User Roles
export const USER_ROLES = {
  ADMIN: "admin",
  CUSTOMER: "customer",
  DELIVERY_PARTNER: "delivery_partner",
} as const;

// Route Paths
export const ROUTES = {
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/forgot-password",
  },
  ADMIN: {
    LOGIN: "/admin/login",
    DASHBOARD: "/admin/dashboard",
    PRODUCTS: "/admin/products",
    CATEGORIES: "/admin/categories",
    ORDERS: "/admin/orders",
  },
  CUSTOMER: {
    LOGIN: "/customer/login",
    REGISTER: "/customer/register",
    DASHBOARD: "/customer/dashboard",
    PROFILE: "/customer/profile",
    ORDERS: "/customer/orders",
  },
  DELIVERY: {
    LOGIN: "/delivery/login",
    DASHBOARD: "/delivery/dashboard",
    ORDERS: "/delivery/orders",
    PROFILE: "/delivery/profile",
  },
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  USER_DATA: "userData",
  THEME: "theme",
} as const;

// API Response Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;
