import { createProxyMiddleware } from "http-proxy-middleware";
import { Request, Response } from "express";

// Default service URLs

const DEFAULT_SERVICE_URLS = {
  AUTH: "http://auth-service-srv:4000",
  USER: "http://user-service-srv:4001",
  PRODUCT: "http://products-service-srv:4002",
  ORDER: "http://order-service-srv:4003",
  PAYMENT: "http://payment-service-srv:4004",
  DELIVERY: "http://delivery-service-srv:4005",
};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const servicesConfig = {
  auth: {
    target: process.env.AUTH_SERVICE_URL || DEFAULT_SERVICE_URLS.AUTH,
    pathRewrite: {},
    changeOrigin: true,
    logLevel: "debug",
    secure: false,
    timeout: 30000,
    onProxyReq: (proxyReq: any, req: Request, res: Response) => {
      console.log(
        `[${new Date().toISOString()}] Proxying request to auth service:`,
        {
          method: req.method,
          path: req.path,
          body: req.body,
        }
      );
    },
    onError: (err: Error, req: Request, res: Response) => {
      console.error(
        `[${new Date().toISOString()}] Proxy error for auth service:`,
        err
      );
      res.status(500).json({
        success: false,
        message: "Failed to connect to auth service. Please try again later.",
      });
    },
    onProxyRes: (proxyRes: any, req: Request, res: Response) => {
      // Forward the status code and response from the auth service
      res.status(proxyRes.statusCode);
    },
  },
  users: {
    target: process.env.USER_SERVICE_URL || DEFAULT_SERVICE_URLS.USER,
    pathRewrite: {},
    changeOrigin: true,
    logLevel: "debug",
    secure: false,
    timeout: 30000,
    onProxyReq: (proxyReq: any, req: Request, res: Response) => {
      // Forward the user information from the JWT token
      if (req.user) {
        proxyReq.setHeader("X-User-Email", req.user.email);
        proxyReq.setHeader("X-User-Role", req.user.role);
      }

      // Log the request
      console.log(
        `[${new Date().toISOString()}] Proxying request to user service:`,
        {
          method: req.method,
          path: req.path,
          email: req.user?.email,
          role: req.user?.role,
        }
      );
    },
  },
  products: {
    target: process.env.PRODUCT_SERVICE_URL || DEFAULT_SERVICE_URLS.PRODUCT,
    pathRewrite: {},
    changeOrigin: true,
    logLevel: "debug",
    secure: false,
    timeout: 30000,
  },
  orders: {
    target: process.env.ORDER_SERVICE_URL || DEFAULT_SERVICE_URLS.ORDER,
    pathRewrite: {},
    changeOrigin: true,
    logLevel: "debug",
    secure: false,
    timeout: 30000,
    onProxyReq: (proxyReq: any, req: Request, res: Response) => {
      // Forward the user information from the JWT token
      if (req.user) {
        proxyReq.setHeader("x-user-email", req.user.email);
        proxyReq.setHeader("x-user-role", req.user.role);
      }

      // Log the request
      console.log(
        `[${new Date().toISOString()}] Proxying request to order service:`,
        {
          method: req.method,
          path: req.path,
          body: req.body,
          email: req.user?.email,
          role: req.user?.role,
        }
      );
    },
    onError: (err: Error, req: Request, res: Response) => {
      console.error(
        `[${new Date().toISOString()}] Proxy error for order service:`,
        err
      );
      res.status(500).json({
        success: false,
        message: "Failed to connect to order service. Please try again later.",
      });
    },
    onProxyRes: (proxyRes: any, req: Request, res: Response) => {
      // Forward the status code and response from the order service
      res.status(proxyRes.statusCode);
    },
  },
  payments: {
    target: process.env.PAYMENT_SERVICE_URL || DEFAULT_SERVICE_URLS.PAYMENT,
    pathRewrite: {},
    changeOrigin: true,
    logLevel: "debug",
    secure: false,
    timeout: 30000,
    onProxyReq: (proxyReq: any, req: Request, res: Response) => {
      console.log(
        `[${new Date().toISOString()}] Proxying request to payment service:`,
        {
          method: req.method,
          path: req.path,
          body: req.body,
        }
      );
    },
    onError: (err: Error, req: Request, res: Response) => {
      console.error(
        `[${new Date().toISOString()}] Proxy error for payment service:`,
        err
      );
      res.status(500).json({
        success: false,
        message:
          "Failed to connect to payment service. Please try again later.",
      });
    },
  },
  delivery: {
    target: process.env.DELIVERY_SERVICE_URL || DEFAULT_SERVICE_URLS.DELIVERY,
    pathRewrite: {},
    changeOrigin: true,
    logLevel: "debug",
    secure: false,
    timeout: 30000,
    onProxyReq: (proxyReq: any, req: Request, res: Response) => {
      // Forward the user information from the JWT token if available
      if (req.user) {
        proxyReq.setHeader("X-User-Email", req.user.email);
        proxyReq.setHeader("X-User-Role", req.user.role);
      }

      // Log the request
      console.log(
        `[${new Date().toISOString()}] Proxying request to delivery service:`,
        {
          method: req.method,
          path: req.path,
          email: req.user?.email,
          role: req.user?.role,
        }
      );
    },
  },
};

export const createProxy = (config: any) => {
  if (!config.target) {
    throw new Error(`Missing target URL for service configuration`);
  }

  return createProxyMiddleware({
    ...config,
    onProxyReq: (proxyReq: any, req: Request, res: Response) => {
      // Log the request
      console.log(`[${new Date().toISOString()}] Proxying request:`, {
        method: req.method,
        path: req.path,
        target: config.target,
      });
    },
    onError: (err: Error, req: Request, res: Response) => {
      console.error(`[${new Date().toISOString()}] Proxy error:`, err);
      res.status(500).json({ error: "Failed to connect to service" });
    },
  });
};
