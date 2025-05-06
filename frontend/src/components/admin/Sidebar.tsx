"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/utils";
import { authService } from "@/services/auth.service";
import { 
  LayoutDashboard, 
  Tag, 
  ShoppingBag, 
  ClipboardList, 
  Users, 
  ChevronLeft, 
  LogOut,
  Menu 
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard size={18} /> },
  { name: "Categories", href: "/admin/categories", icon: <Tag size={18} /> },
  { name: "Products", href: "/admin/products", icon: <ShoppingBag size={18} /> },
  { name: "Orders", href: "/admin/orders", icon: <ClipboardList size={18} /> },
  { name: "Users", href: "/admin/users", icon: <Users size={18} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      // Clear cookies
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  // Mobile menu button that's always visible
  const MobileMenuButton = () => (
    <button 
      onClick={toggleSidebar}
      className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md text-gray-700 hover:text-emerald-600 transition-colors"
    >
      <Menu size={20} />
    </button>
  );

  const sidebarClasses = cn(
    "flex flex-col h-screen bg-white border-r border-gray-100 shadow-sm transition-all duration-300",
    collapsed && !isMobile ? "w-20" : "w-64",
    isMobile ? "fixed z-40 top-0 left-0 h-full" : "relative",
    isMobile && !mobileOpen ? "-translate-x-full" : "translate-x-0"
  );

  const overlayClasses = cn(
    "fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity",
    mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
  );

  return (
    <>
      <MobileMenuButton />
      
      {/* Overlay for mobile */}
      <div className={overlayClasses} onClick={() => setMobileOpen(false)}></div>
      
      <aside className={sidebarClasses}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          {!collapsed || isMobile ? (
            <h1 className="text-xl font-bold text-gray-800">QuickStore</h1>
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <span className="text-emerald-600 font-bold text-lg">Q</span>
            </div>
          )}
          
          {/* Collapse button - visible only on desktop */}
          {!isMobile && (
            <button 
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={20} className={cn("transition-transform", collapsed ? "rotate-180" : "")} />
            </button>
          )}
          
          {/* Close button - visible only on mobile */}
          {isMobile && (
            <button 
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg py-2.5 px-3 transition-colors duration-200",
                      isActive 
                        ? "bg-emerald-50 text-emerald-600" 
                        : "text-gray-700 hover:bg-gray-50 hover:text-emerald-600",
                      collapsed && !isMobile ? "justify-center" : "justify-start"
                    )}
                  >
                    <span className={cn(
                      "flex items-center justify-center",
                      isActive ? "text-emerald-600" : "text-gray-500"
                    )}>
                      {item.icon}
                    </span>
                    
                    {(!collapsed || isMobile) && (
                      <span className={cn(
                        "ml-3 font-medium text-sm",
                        isActive ? "text-emerald-600" : "text-gray-700"
                      )}>
                        {item.name}
                      </span>
                    )}
                    
                    {isActive && !collapsed && !isMobile && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Logout button */}
        {isClient && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center rounded-lg py-2.5 px-3 text-sm font-medium transition-colors",
                "text-gray-700 hover:bg-gray-50 hover:text-emerald-600",
                collapsed && !isMobile ? "justify-center" : "justify-start"
              )}
            >
              <LogOut size={18} className="text-gray-500" />
              {(!collapsed || isMobile) && <span className="ml-3">Logout</span>}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}