"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "customer" | "delivery_partner";
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, canAccess } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (requiredRole && !canAccess(requiredRole)) {
        // Redirect to appropriate dashboard based on role
        switch (requiredRole) {
          case "admin":
            router.push("/admin/dashboard");
            break;
          case "customer":
            router.push("/customer/dashboard");
            break;
          case "delivery_partner":
            router.push("/delivery-partner/dashboard");
            break;
          default:
            router.push("/");
        }
      }
    }
  }, [isAuthenticated, isLoading, requiredRole, router, canAccess]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || (requiredRole && !canAccess(requiredRole))) {
    return null;
  }

  return <>{children}</>;
}
