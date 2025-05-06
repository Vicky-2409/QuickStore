"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";
import {
  getAccessToken,
  getRefreshToken,
  getUser,
  isValidToken,
} from "@/utils/auth";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function   AdminRoute({ children }: AdminRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user, isInitialized } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check both Redux state and cookies
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();
        const storedUser = getUser();

        console.log("Auth check:", {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasStoredUser: !!storedUser,
          isTokenValid: accessToken ? isValidToken(accessToken) : false,
          isReduxAuthenticated: isAuthenticated,
          isReduxInitialized: isInitialized,
          userRole: user?.role,
        });

        const isAuthenticatedInCookies =
          accessToken &&
          refreshToken &&
          storedUser &&
          isValidToken(accessToken);
        const isAdminInCookies = storedUser?.role === "admin";

        // If cookies are valid but Redux state is not initialized, wait
        if (isAuthenticatedInCookies && !isInitialized) {
          console.log("Waiting for Redux initialization...");
          return;
        }

        // If either cookies or Redux state shows not authenticated/not admin, redirect
        if (
          (!isAuthenticatedInCookies || !isAdminInCookies) &&
          (!isAuthenticated || user?.role !== "admin")
        ) {
          console.log("Unauthorized access, redirecting to login...");
          window.location.href = ROUTES.ADMIN.LOGIN;
          return;
        }

        setIsChecking(false);
      } catch (error) {
        console.error("Error in auth check:", error);
        window.location.href = ROUTES.ADMIN.LOGIN;
      }
    };

    checkAuth();
  }, [isAuthenticated, user?.role, isInitialized]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
