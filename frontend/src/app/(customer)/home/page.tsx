"use client";

import React, { useEffect } from "react";
import { Table, Badge } from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import {
  fetchOrders,
  selectOrders,
  selectOrdersStatus,
} from "../../../store/slices/ordersSlice";
import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  RefreshCcw,
  Smartphone,
} from "lucide-react";
import { Order } from "@/services/order.service";

const features = [
  {
    icon: <Truck size={32} />,
    title: "Fast Delivery",
    description: "Get your products delivered within 24 hours",
  },
  {
    icon: <ShieldCheck size={32} />,
    title: "Secure Payment",
    description: "100% secure payment with multiple options",
  },
  {
    icon: <RefreshCcw size={32} />,
    title: "Easy Returns",
    description: "30-day hassle-free return policy",
  },
  {
    icon: <Smartphone size={32} />,
    title: "Mobile App",
    description: "Shop on the go with our mobile app",
  },
];

const HomePage: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const orders = useSelector(selectOrders);
  const status = useSelector(selectOrdersStatus);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const recentOrders = orders?.slice(0, 5) || [];

  if (status === "loading") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-3xl mb-16"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 rounded-xl p-6 h-40"></div>
            ))}
          </div>
          <div className="bg-gray-200 rounded-xl p-6 h-96"></div>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h2 className="text-red-600 text-lg font-semibold mb-2">
            Error Loading Orders
          </h2>
          <p className="text-red-500">
            Failed to load your orders. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const columns = [
    {
      title: "Order ID",
      dataIndex: "_id",
      key: "_id",
      render: (id: string) => (
        <span className="font-medium">{id?.substring(0, 8)}...</span>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string | Date) => {
        const dateObj = typeof date === "string" ? new Date(date) : date;
        return (
          <span className="text-gray-600">{dateObj.toLocaleDateString()}</span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: Order["status"]) => {
        const statusColors: Record<Order["status"], string> = {
          pending: "bg-yellow-100 text-yellow-800",
          assigned: "bg-blue-100 text-blue-800",
          picked_up: "bg-purple-100 text-purple-800",
          on_the_way: "bg-indigo-100 text-indigo-800",
          delivered: "bg-green-100 text-green-800",
        };
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}
          >
            {status?.charAt(0).toUpperCase() + status?.slice(1)}
          </span>
        );
      },
    },
    {
      title: "Total Amount",
      dataIndex: "total",
      key: "total",
      render: (amount: number) => (
        <span className="font-medium">${amount?.toFixed(2) || "0.00"}</span>
      ),
    },
  ];

  const orderStats = {
    total: orders?.length || 0,
    pending:
      orders?.filter((order: Order) => order.status === "pending").length || 0,
    delivered:
      orders?.filter((order: Order) => order.status === "delivered").length ||
      0,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <section className="relative rounded-3xl bg-gradient-to-r from-emerald-50 to-teal-50 p-8 md:p-16 mb-16 overflow-hidden">
        <div className="absolute inset-0 bg-white/30 backdrop-blur-sm -z-10"></div>
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-700">
            Fresh Goods, Fast Delivery
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Discover amazing products at great prices. Shop with confidence and
            enjoy fast delivery to your doorstep.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push("/shop")}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-full transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag size={20} />
              Shop Now
            </button>
            <button
              onClick={() => router.push("/shop")}
              className="px-8 py-3 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium rounded-full transition-all"
            >
              Browse Categories
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col items-center text-center"
            >
              <div className="text-emerald-500 mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Custom styling for Ant Design table */}
      <style jsx global>{`
        .custom-table .ant-table {
          background: transparent;
        }
        .custom-table .ant-table-thead > tr > th {
          background: #f9fafb;
          color: #4b5563;
          font-weight: 600;
          border-bottom: 1px solid #e5e7eb;
        }
        .custom-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f3f4f6;
        }
        .custom-table .ant-table-tbody > tr:hover > td {
          background: #f3f4f6;
        }
        .custom-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none;
        }
        .custom-table .ant-pagination-item-active {
          border-color: #10b981;
        }
        .custom-table .ant-pagination-item-active a {
          color: #10b981;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
