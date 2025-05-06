import { Router } from "express";
import { DeliveryController } from "../controllers/delivery.controller";

export const createDeliveryRoutes = (
  deliveryController: DeliveryController
) => {
  const router = Router();

  // Order routes
  router.get(
    "/order",
    deliveryController.getAllOrders.bind(deliveryController)
  );
  router.post(
    "/order",
    deliveryController.createOrder.bind(deliveryController)
  );
  router.get(
    "/order/pending",
    deliveryController.getPendingOrders.bind(deliveryController)
  );
  router.get(
    "/order/active",
    deliveryController.getActiveOrder.bind(deliveryController)
  );
  router.get(
    "/order/completed",
    deliveryController.getCompletedOrders.bind(deliveryController)
  );
  router.get(
    "/order/:orderId",
    deliveryController.getOrder.bind(deliveryController)
  );
  router.get(
    "/order/customer/:email",
    deliveryController.getOrdersByCustomerEmail.bind(deliveryController)
  );
  router.put(
    "/order/:orderId/status",
    deliveryController.updateOrderStatus.bind(deliveryController)
  );
  router.post(
    "/order/assign",
    deliveryController.assignDeliveryPartner.bind(deliveryController)
  );

  // Partner routes
  router.get(
    "/partners",
    deliveryController.getAvailablePartners.bind(deliveryController)
  );
  router.put(
    "/partners/:id/availability",
    deliveryController.updatePartnerAvailability.bind(deliveryController)
  );

  return router;
};
