import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import {
  authorizeAdmin,
  authorizeCustomer,
  authenticate,
} from "../middleware/auth.middleware";

export const createUserRoutes = (userController: UserController): Router => {
  const router = Router();

  // Admin route
  router.get("/", authenticate, userController.getAllUsers);

  router.get(
    "/customers",
    authenticate,
    authorizeAdmin,
    userController.getCustomers
  );

  // Customer routes
  router.get("/profile", authenticate, userController.getProfile);
  router.patch("/profile", authenticate, userController.updateProfile);
  router.get("/email/:email", authenticate, userController.getUserByEmail);

  // Address routes
  router.get("/address", authenticate, userController.getAddresses);
  router.post("/address", authenticate, userController.addAddress);
  router.patch(
    "/address/:addressId",
    authenticate,
    userController.updateAddress
  );
  router.delete(
    "/address/:addressId",
    authenticate,
    userController.deleteAddress
  );

  // Wallet routes
  router.patch("/wallet", authenticate, userController.addWalletTransaction);

  // Cart routes
  router.post("/cart", authenticate, userController.addToCart);
  router.get("/cart", authenticate, userController.getCart);
  router.patch("/cart", authenticate, userController.updateCart);
  router.delete("/cart", authenticate, userController.clearCart);
  router.delete(
    "/cart/:productId",
    authenticate,
    userController.removeFromCart
  );

  return router;
};
