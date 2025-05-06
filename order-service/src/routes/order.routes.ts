import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { validateRequest } from "../middleware/validate-request";
import { isAuthenticated } from "../middleware/is-authenticated";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../validators/order.validator";

const createRouter = (controller: OrderController) => {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(isAuthenticated);

  // Create a new order
  router.post("/", validateRequest(createOrderSchema), (req, res, next) => {
    controller.createOrder(req, res).catch(next);
  });

  // Get all orders for authenticated user
  router.get("/", (req, res, next) => {
    controller.getOrders(req, res).catch(next);
  });

  // Get all orders (admin only)
  router.get("/all", (req, res, next) => {
    controller.getAllOrders(req, res).catch(next);
  });

  // Get a specific order by ID
  router.get("/:orderId", (req, res, next) => {
    controller.getOrderById(req, res).catch(next);
  });

  // Update order status
  router.post(
    "/:orderId/status",
    validateRequest(updateOrderStatusSchema),
    (req, res, next) => {
      controller.updateOrderStatus(req, res).catch(next);
    }
  );

  // Get unassigned orders (for admin/delivery partners)
  router.get("/unassigned", (req, res, next) => {
    controller.getUnassignedOrders(req, res).catch(next);
  });

  // Update payment status
  router.post("/:orderId/payment", (req, res, next) => {
    controller.updatePaymentStatus(req, res).catch(next);
  });

  return router;
};

export default createRouter;
