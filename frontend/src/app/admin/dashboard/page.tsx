"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { authService } from "@/services/auth.service";
import { adminService } from "@/services/admin.service";
import { 
  ShoppingBag, 
  Clock, 
  Package, 
  Users, 
  TrendingUp,
  Loader2,
  ArrowUp,
  ArrowRight
} from "lucide-react";

interface DashboardStats {
  totalOrders: number;
  totalUsers: number;
  totalDeliveryPartners: number;
  ordersInProgress: number;
  deliveredOrders: number;
  orderStatusDistribution: {
    status: string;
    count: number;
  }[];
}

const StatCard = ({ 
  title, 
  count, 
  icon, 
  growthRate, 
  bgColor 
}: { 
  title: string; 
  count: number; 
  icon: React.ReactNode; 
  growthRate?: number;
  bgColor: string; 
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-transform hover:scale-[1.02] hover:shadow-md">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold">{count.toLocaleString()}</h3>
        {growthRate && (
          <div className="flex items-center mt-2 text-xs">
            <div className={`flex items-center ${growthRate >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {growthRate >= 0 ? <ArrowUp size={12} /> : <ArrowUp size={12} className="rotate-180" />}
              <span className="ml-1 font-medium">{Math.abs(growthRate)}%</span>
            </div>
            <span className="ml-1 text-gray-500">vs last month</span>
          </div>
        )}
      </div>
      <div className={`${bgColor} p-3 rounded-lg`}>
        {icon}
      </div>
    </div>
  </div>
);

const OrderStatusChart = ({ data }: { data: { status: string; count: number }[] }) => {
  // Calculate the total for percentages
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  // Color mapping for status
  const colorMap: Record<string, string> = {
    "Pending": "bg-yellow-500",
    "Picked": "bg-blue-500",
    "On the way": "bg-indigo-500",
    "Picked up": "bg-purple-500",
    "Delivered": "bg-emerald-500",
    "Cancelled": "bg-red-500"
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Order Status Distribution</h3>
        <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center">
          View All <ArrowRight size={16} className="ml-1" />
        </button>
      </div>
      
      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0;
          return (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{item.status}</span>
                <span className="text-sm font-medium text-gray-700">
                  {item.count} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${colorMap[item.status] || 'bg-gray-500'}`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};



export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalUsers: 0,
    totalDeliveryPartners: 0,
    ordersInProgress: 0,
    deliveredOrders: 0,
    orderStatusDistribution: [],
  });

  useEffect(() => {
    const checkAuth = async () => {
      const user = await authService.getCurrentUser();
      console.log(user);
      if (!user || user.role !== "admin") {
        router.push("/admin/login");
        return;
      }
      fetchDashboardStats();
    };
    checkAuth();
  }, [router]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Fetch total orders
      const ordersResponse = await adminService.getAllOrders();
      const totalOrders = ordersResponse.length;

      // Fetch users and delivery partners
      const usersResponse = await adminService.getUsers();
      const totalUsers = usersResponse.filter(
        (user) => user.role === "customer"
      ).length;
      const totalDeliveryPartners = usersResponse.filter(
        (user) => user.role === "delivery_partner"
      ).length;

      // Calculate orders in progress and delivered orders
      const ordersInProgress = ordersResponse.filter((order: any) =>
        ["pending", "picked", "on_the_way", "picked_up"].includes(order.status)
      ).length;

      const deliveredOrders = ordersResponse.filter(
        (order: any) => order.status === "delivered"
      ).length;

      // Calculate order status distribution
      const statusCounts = ordersResponse.reduce((acc: any, order: any) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      const orderStatusDistribution = Object.entries(statusCounts).map(
        ([status, count]) => ({
          status:
            status.charAt(0).toUpperCase() + status.slice(1).replace("_", " "),
          count: count as number,
        })
      );

      setStats({
        totalOrders,
        totalUsers,
        totalDeliveryPartners,
        ordersInProgress,
        deliveredOrders,
        orderStatusDistribution,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="flex items-center justify-center h-full min-h-[70vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-500">Overview of your store performance and operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Orders" 
          count={stats.totalOrders} 
          icon={<ShoppingBag size={22} className="text-white" />} 
          bgColor="bg-emerald-500"
          growthRate={12.5} 
        />
        <StatCard 
          title="Orders In Progress" 
          count={stats.ordersInProgress} 
          icon={<Clock size={22} className="text-white" />} 
          bgColor="bg-blue-500"
          growthRate={8.3} 
        />
        <StatCard 
          title="Delivered Orders" 
          count={stats.deliveredOrders} 
          icon={<Package size={22} className="text-white" />} 
          bgColor="bg-indigo-500"
          growthRate={15.2} 
        />
        <StatCard 
          title="Delivery Partners" 
          count={stats.totalDeliveryPartners} 
          icon={<Users size={22} className="text-white" />} 
          bgColor="bg-purple-500"
          growthRate={5.7} 
        />
        <StatCard 
          title="Users" 
          count={stats.totalUsers} 
          icon={<Users size={22} className="text-white" />} 
          bgColor="bg-pink-500"
          growthRate={22.8} 
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderStatusChart data={stats.orderStatusDistribution} />
      </div>
    </div>
  );
}