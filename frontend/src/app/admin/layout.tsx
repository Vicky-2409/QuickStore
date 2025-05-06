"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isAdmin, isLoading, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Skip auth check for login page
  const isLoginPage = pathname === ROUTES.ADMIN.LOGIN;

  useEffect(() => {
    // Only check auth if initialization is complete and not already redirecting
    if (isInitialized && !isLoading && !isRedirecting) {
      const shouldRedirectToLogin =
        !isLoginPage && (!isAuthenticated || !isAdmin());
      const shouldRedirectToDashboard =
        isLoginPage && isAuthenticated && isAdmin();

      if (shouldRedirectToLogin && pathname !== ROUTES.ADMIN.LOGIN) {
        setIsRedirecting(true);
        router.push(ROUTES.ADMIN.LOGIN);
      } else if (
        shouldRedirectToDashboard &&
        pathname !== ROUTES.ADMIN.DASHBOARD
      ) {
        setIsRedirecting(true);
        router.push(ROUTES.ADMIN.DASHBOARD);
      }
    }
  }, [
    isAuthenticated,
    isAdmin,
    isLoading,
    isInitialized,
    router,
    isLoginPage,
    pathname,
    isRedirecting,
  ]);

  // Reset redirecting state when pathname changes
  useEffect(() => {
    setIsRedirecting(false);
  }, [pathname]);

  // Show loading state while initializing or loading
  if (!isInitialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-700">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated and not on login page
  if (!isLoginPage && (!isAuthenticated || !isAdmin())) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {!isLoginPage && <Sidebar />}
      <main className={`flex-1 transition-all duration-300 ${!isLoginPage ? 'p-6' : 'p-0'}`}>
        <div className={`${!isLoginPage ? 'bg-white rounded-xl shadow-sm border border-gray-100 min-h-[calc(100vh-3rem)]' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
}