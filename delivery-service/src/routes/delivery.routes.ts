import { Router } from "express";
import { DeliveryController } from "../controllers/delivery.controller";

export const createDeliveryRoutes = (
  deliveryController: DeliveryController
) => {
  const router = Router();

  // Order routes
  router.get(
    "/orders",
    deliveryController.getAllOrders.bind(deliveryController)
  );
  router.post(
    "/orders",
    deliveryController.createOrder.bind(deliveryController)
  );
  router.get(
    "/orders/pending",
    deliveryController.getPendingOrders.bind(deliveryController)
  );
  router.get(
    "/orders/active",
    deliveryController.getActiveOrder.bind(deliveryController)
  );
  router.get(
    "/orders/completed",
    deliveryController.getCompletedOrders.bind(deliveryController)
  );
  router.get(
    "/orders/:orderId",
    deliveryController.getOrder.bind(deliveryController)
  );
  router.get(
    "/orders/customer/:email",
    deliveryController.getOrdersByCustomerEmail.bind(deliveryController)
  );
  router.put(
    "/orders/:orderId/status",
    deliveryController.updateOrderStatus.bind(deliveryController)
  );
  router.post(
    "/orders/assign",
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
