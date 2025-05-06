"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";
import { ROUTES } from "@/constants";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !isAdmin()) {
        toast.error("Unauthorized access");
        router.push(ROUTES.ADMIN.LOGIN);
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !isAdmin()) {
    return null;
  }

  return <>{children}</>;
};

export default AdminRoute;
