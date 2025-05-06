import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTES, USER_ROLES } from "@/constants";
import { isValidToken, getTokenPayload } from "@/utils/auth";

export function authMiddleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const userStr = request.cookies.get("user")?.value;

  // Public routes that don't require authentication
  const publicRoutes = [
    ROUTES.ADMIN.LOGIN,
    ROUTES.CUSTOMER.LOGIN,
    ROUTES.CUSTOMER.REGISTER,
    ROUTES.DELIVERY.LOGIN,
  ];

  // If accessing a public route
  if (publicRoutes.includes(path)) {
    // If already logged in, redirect based on role
    if (accessToken && refreshToken && userStr && isValidToken(accessToken)) {
      try {
        const user = JSON.parse(userStr);
        const tokenPayload = getTokenPayload(accessToken);

        // Verify token payload matches user data
        if (tokenPayload && tokenPayload.id === user._id) {
          if (user.role === USER_ROLES.ADMIN && path === ROUTES.ADMIN.LOGIN) {
            return NextResponse.redirect(
              new URL(ROUTES.ADMIN.DASHBOARD, request.url)
            );
          }
          if (
            user.role === USER_ROLES.CUSTOMER &&
            path === ROUTES.CUSTOMER.LOGIN
          ) {
            return NextResponse.redirect(
              new URL(ROUTES.CUSTOMER.DASHBOARD, request.url)
            );
          }
          if (
            user.role === USER_ROLES.DELIVERY_PARTNER &&
            path === ROUTES.DELIVERY.LOGIN
          ) {
            return NextResponse.redirect(
              new URL(ROUTES.DELIVERY.DASHBOARD, request.url)
            );
          }
        }
      } catch (error) {
        // If user data is invalid, clear cookies and continue
        const response = NextResponse.next();
        response.cookies.delete("access_token");
        response.cookies.delete("refresh_token");
        response.cookies.delete("user");
        return response;
      }
    }
    return NextResponse.next();
  }

  // Protected routes
  if (!accessToken || !refreshToken || !userStr || !isValidToken(accessToken)) {
    // Redirect to appropriate login page based on the route
    if (path.startsWith("/admin")) {
      return NextResponse.redirect(new URL(ROUTES.ADMIN.LOGIN, request.url));
    } else if (path.startsWith("/customer")) {
      return NextResponse.redirect(new URL(ROUTES.CUSTOMER.LOGIN, request.url));
    } else if (path.startsWith("/delivery-partner")) {
      return NextResponse.redirect(new URL(ROUTES.DELIVERY.LOGIN, request.url));
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    // Admin routes
    "/admin/:path*",
    "/api/admin/:path*",

    // Customer routes
    "/customer/:path*",
    "/api/customer/:path*",

    // Delivery partner routes
    "/delivery-partner/:path*",
    "/api/delivery-partner/:path*",

    // Auth routes
    "/login",
    "/register",
    "/forgot-password",
    "/admin/login",
    "/customer/login",
    "/customer/register",
    "/delivery-partner/login",

    // API routes
    "/api/auth/:path*",
    "/api/products/:path*",
    "/api/categories/:path*",
    "/api/orders/:path*",
  ],
};
