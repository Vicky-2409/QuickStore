import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware";

export const createAuthRoutes = (authController: AuthController): Router => {
  const router = Router();

  // Auth routes
  router.post("/login", authController.login);
  router.post("/register", authController.register);
  router.post("/verify-otp", authController.verifyOTP);
  router.post("/resend-otp", authController.resendOTP);
  router.post("/refresh-token", authController.refreshToken);
  router.post("/logout", authenticate, authController.logout);
  router.get("/me", authenticate, authController.getCurrentUser);

  // Admin user management routes
  router.get(
    "/users",
    authenticate,
    authorizeAdmin,
    authController.getAllUsers
  );
  router.patch(
    "/users/:id/status",
    authenticate,
    authorizeAdmin,
    authController.toggleUserStatus
  );

  return router;
};
