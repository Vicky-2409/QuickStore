import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { logout } from "@/store/slices/authSlice";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = () => {
    dispatch(logout());
    router.push("/admin/login");
  };

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">Evara Dashboard</h1>
        </div>
        <nav className="mt-6">
          <Link
            href="/admin/dashboard"
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 ${
              isActive("/admin/dashboard") ? "bg-gray-100" : ""
            }`}
          >
            <span>Dashboard</span>
          </Link>
          <Link
            href="/admin/products"
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 ${
              isActive("/admin/products") ? "bg-gray-100" : ""
            }`}
          >
            <span>Products</span>
          </Link>
          <Link
            href="/admin/categories"
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 ${
              isActive("/admin/categories") ? "bg-gray-100" : ""
            }`}
          >
            <span>Categories</span>
          </Link>
          <Link
            href="/admin/orders"
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 ${
              isActive("/admin/orders") ? "bg-gray-100" : ""
            }`}
          >
            <span>Orders</span>
          </Link>
          <Link
            href="/admin/users"
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 ${
              isActive("/admin/users") ? "bg-gray-100" : ""
            }`}
          >
            <span>Users</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100"
          >
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
