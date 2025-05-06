import { Router } from "express";
import { createProxy } from "../config/services.config";
import { servicesConfig } from "../config/services.config";
import { authenticate, authorizeRole } from "../middlewares/auth.middleware";

export const createProxyRoutes = (): Router => {
  const router = Router();

  // Health check
  router.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Auth service routes
  const authProxy = createProxy(servicesConfig.auth);
  router.use("/api/auth", authProxy);

  // Public routes
  const productProxy = createProxy(servicesConfig.products);
  router.use("/api/products", productProxy);
  router.use("/api/categories", productProxy);

  // Delivery service routes (public)
  const deliveryProxy = createProxy(servicesConfig.delivery);
  router.use("/api/delivery", deliveryProxy);

  // Order service routes (public for creation, protected for other operations)
  const orderProxy = createProxy(servicesConfig.orders);
  router.post("/api/orders", orderProxy); // Allow POST without auth
  router.get("/api/orders", authenticate, orderProxy); // Protect GET all orders
  router.get("/api/orders/:orderId", authenticate, orderProxy); // Protect GET single order
  router.put("/api/orders/:orderId/status", authenticate, orderProxy); // Protect status updates
  router.use("/api/orders", authenticate, orderProxy); // Protect other operations

  // Protected routes
  router.use(authenticate);

  // User service routes
  const userProxy = createProxy(servicesConfig.users);
  router.use("/api/users", userProxy);

  // Payment service routes
  const paymentProxy = createProxy(servicesConfig.payments);
  router.use("/api/payments", paymentProxy);

  // Admin routes
  router.use(authorizeRole(["admin"]));

  // Admin product routes
  const adminProductProxy = createProxy(servicesConfig.products);
  router.use("/api/products", adminProductProxy);

  return router;
};
