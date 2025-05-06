import { Middleware } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { logout, setCredentials } from "../slices/authSlice";
import { ROUTES, USER_ROLES } from "@/constants";
import {
  getAccessToken,
  getRefreshToken,
  getUser,
  isValidToken,
} from "@/utils/auth";
import { UserRole } from "@/enums/user.enum";

const authMiddleware: Middleware = (store) => (next) => (action) => {
  // Get current state
  const state = store.getState() as RootState;
  const { user, isAuthenticated, isInitialized } = state.auth;
  const path = window.location.pathname;

  // Skip middleware if auth state is not initialized
  if (!isInitialized) {
    return next(action);
  }

  // Skip middleware for login pages
  if (path.includes("/login")) {
    return next(action);
  }

  // Define protected routes and their allowed roles
  const protectedRoutes = {
    [ROUTES.ADMIN.DASHBOARD]: [USER_ROLES.ADMIN],
    [ROUTES.CUSTOMER.DASHBOARD]: [USER_ROLES.CUSTOMER],
    [ROUTES.DELIVERY.DASHBOARD]: [USER_ROLES.DELIVERY_PARTNER],
  };

  // Check if the current path is protected
  const protectedRoute = Object.entries(protectedRoutes).find(([route]) =>
    path.startsWith(route)
  );

  if (protectedRoute) {
    const [route, allowedRoles] = protectedRoute;

    // Check if we have valid tokens in cookies
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    const storedUser = getUser();

    // If we have valid tokens but Redux state is not authenticated, update Redux state
    if (
      accessToken &&
      refreshToken &&
      storedUser &&
      isValidToken(accessToken) &&
      !isAuthenticated
    ) {
      store.dispatch(
        setCredentials({
          user: storedUser,
          accessToken,
          refreshToken,
        })
      );
      return next(action);
    }

    // If user is not authenticated or tokens are invalid, redirect to appropriate login page
    if (
      !isAuthenticated ||
      !accessToken ||
      !refreshToken ||
      !storedUser ||
      !isValidToken(accessToken)
    ) {
      let loginRoute = ROUTES.ADMIN.LOGIN;

      if (route === ROUTES.ADMIN.DASHBOARD) {
        loginRoute = ROUTES.ADMIN.LOGIN;
      } else if (route === ROUTES.CUSTOMER.DASHBOARD) {
        loginRoute = ROUTES.CUSTOMER.LOGIN;
      } else if (route === ROUTES.DELIVERY.DASHBOARD) {
        loginRoute = ROUTES.DELIVERY.LOGIN;
      }

      // Only redirect if not already on the login page
      if (path !== loginRoute) {
        window.location.href = loginRoute;
      }
      return;
    }

    // If user's role doesn't match the required role, redirect to appropriate dashboard
    if (user && !(allowedRoles as UserRole[]).includes(user.role as UserRole)) {
      let dashboardRoute = ROUTES.ADMIN.DASHBOARD;

      if (user.role === USER_ROLES.ADMIN) {
        dashboardRoute = ROUTES.ADMIN.DASHBOARD;
      } else if (user.role === USER_ROLES.CUSTOMER) {
        dashboardRoute = ROUTES.CUSTOMER.DASHBOARD;
      } else if (user.role === USER_ROLES.DELIVERY_PARTNER) {
        dashboardRoute = ROUTES.DELIVERY.DASHBOARD;
      }

      // Only redirect if not already on the correct dashboard
      if (path !== dashboardRoute) {
        window.location.href = dashboardRoute;
      }
      return;
    }
  }

  return next(action);
};

export { authMiddleware };
