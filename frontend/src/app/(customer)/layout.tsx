"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, LogOut, User, Package, Home, Menu, X } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { selectCartItemCount } from "@/store/slices/cartSlice";
import { AuthService } from "@/services/auth.service";
import { logout } from "@/store/slices/authSlice";

const CustomerLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const cartItemCount = useSelector(selectCartItemCount);
  const authService = new AuthService();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navLinks = [
    { path: "/home", label: "Home", icon: <Home className="h-5 w-5" /> },
    { path: "/shop", label: "Shop", icon: null },
    { path: "/orders", label: "Orders", icon: <Package className="h-5 w-5" /> },
    { path: "/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-emerald-700">
                  QuickStore
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out
                    ${
                      isActive(link.path)
                        ? "bg-emerald-50 text-emerald-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-emerald-600"
                    }`}
                >
                  {link.icon && <span className="mr-2">{link.icon}</span>}
                  {link.label}
                </Link>
              ))}
              
              <div className="h-8 w-px bg-gray-200 mx-2"></div>
              
              <Link
                href="/cart"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out relative
                  ${
                    isActive("/cart")
                      ? "bg-emerald-50 text-emerald-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-emerald-600"
                  }`}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500 text-white text-xs font-bold">
                    {cartItemCount}
                  </span>
                )}
              </Link>
              
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out text-gray-600 hover:bg-gray-100 hover:text-emerald-600"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <Link
                href="/cart"
                className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 mr-2"
              >
                <ShoppingCart className="h-6 w-6" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500 text-white text-xs font-bold">
                    {cartItemCount}
                  </span>
                )}
              </Link>
              
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center px-3 py-3 rounded-md text-base font-medium transition-all duration-200 ease-in-out
                    ${
                      isActive(link.path)
                        ? "bg-emerald-50 text-emerald-600"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.icon && <span className="mr-3">{link.icon}</span>}
                  {link.label}
                </Link>
              ))}
              
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center px-3 py-3 rounded-md text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-emerald-600"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">{children}</main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center">
              <span className="text-lg font-semibold text-emerald-600">QuickStore</span>
              <span className="text-gray-500 text-sm ml-2">© {new Date().getFullYear()}</span>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex space-x-6">
                <a href="#" className="text-gray-500 hover:text-emerald-600 transition-colors">Terms</a>
                <a href="#" className="text-gray-500 hover:text-emerald-600 transition-colors">Privacy</a>
                <a href="#" className="text-gray-500 hover:text-emerald-600 transition-colors">Help</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;