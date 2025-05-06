import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export function useAuth() {
  const { user, isAuthenticated, isLoading, isInitialized } = useSelector(
    (state: RootState) => state.auth
  );

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  const isAdmin = () => hasRole("admin");
  const isCustomer = () => hasRole("customer");
  const isDeliveryPartner = () => hasRole("delivery_partner");

  const canAccess = (requiredRole: string) => {
    if (!isAuthenticated) return false;
    return user?.role === requiredRole;
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    hasRole,
    isAdmin,
    isCustomer,
    isDeliveryPartner,
    canAccess,
  };
}
