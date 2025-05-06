"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminService } from "@/services/admin.service";
import { toast } from "react-hot-toast";
import AdminRoute from "@/components/admin/AdminRoute";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { authService } from "@/services/auth.service";
import { orderService } from "@/services/order.service";
import {
  Package,
  Truck,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  User,
  Calendar,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  orderId: string;
  status: string;
  customerEmail: string;
  customerAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  assignedPartnerId?: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    const initUser = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    };
    initUser();
  }, []);

  const handleOrderStatusUpdate = useCallback(
    (orderId: string, newStatus: string) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.orderId === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast.success(`Order #${orderId} status updated to ${newStatus}`);
    },
    []
  );

  useOrderSocket({
    onOrderStatusUpdate: handleOrderStatusUpdate,
    userEmail: user?.email || "",
    role: "admin",
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await adminService.getAllOrdersFromDeliveryService();
      const processedOrders = await Promise.all(
        data.map(async (deliveryOrder) => {
          const orderDetails = await orderService.getOrder(
            deliveryOrder.orderId
          );
          return {
            ...deliveryOrder,
            items: orderDetails.items.map((item) => ({
              productId: item.product._id,
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
            })),
            amount: orderDetails.items.reduce(
              (total, item) => total + item.product.price * item.quantity,
              0
            ),
          };
        })
      );
      setOrders(processedOrders);
    } catch (error) {
      toast.error("Error fetching orders");
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "processing":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "shipped":
        return <Truck className="h-5 w-5 text-blue-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "processing":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "shipped":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((order) => order.status === filterStatus);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <AdminRoute>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <header className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Orders Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage and track all customer orders
                </p>
              </div>

              <div className="mt-4 md:mt-0">
                <div className="inline-flex shadow-sm rounded-md">
                  <button
                    onClick={() => setFilterStatus("all")}
                    className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                      filterStatus === "all"
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    } border border-gray-200`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterStatus("pending")}
                    className={`px-4 py-2 text-sm font-medium ${
                      filterStatus === "pending"
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    } border-t border-b border-gray-200`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setFilterStatus("processing")}
                    className={`px-4 py-2 text-sm font-medium ${
                      filterStatus === "processing"
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    } border-t border-b border-gray-200`}
                  >
                    Processing
                  </button>
                  <button
                    onClick={() => setFilterStatus("delivered")}
                    className={`px-4 py-2 text-sm font-medium ${
                      filterStatus === "delivered"
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    } border-t border-b border-gray-200`}
                  >
                    Delivered
                  </button>
                  <button
                    onClick={() => setFilterStatus("cancelled")}
                    className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                      filterStatus === "cancelled"
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    } border border-gray-200`}
                  >
                    Cancelled
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="space-y-6">
            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-sm p-10">
                <svg
                  className="w-16 h-16 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 12H4M8 16l-4-4 4-4M16 16l4-4-4-4"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No orders found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filterStatus !== "all"
                    ? `There are no orders with "${filterStatus}" status.`
                    : "No orders have been placed yet."}
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200"
                >
                  {/* Order Header */}
                  <div
                    className="p-6 flex flex-col md:flex-row md:items-center md:justify-between cursor-pointer"
                    onClick={() => toggleOrderExpansion(order.orderId)}
                  >
                    <div className="flex items-start space-x-4 mb-4 md:mb-0">
                      <div className="rounded-full bg-gray-100 p-3">
                        {getStatusIcon(order.status)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-lg font-semibold text-gray-900">
                            Order #{order.orderId.substring(0, 6)}
                          </h2>
                          <span
                            className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                          <div className="flex items-center">
                            <ShoppingBag className="h-4 w-4 mr-1" />
                            <span>{order.items?.length || 0} items</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-lg md:text-xl text-gray-900">
                        ${order.amount.toFixed(2)}
                      </div>
                      <div className="ml-4">
                        {expandedOrder === order.orderId ? (
                          <ChevronDown className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-emerald-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Details - Expandable */}
                  {expandedOrder === order.orderId && (
                    <div className="border-t border-gray-100">
                      {/* Order Items */}
                      <div className="p-6">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                          <ShoppingBag className="h-4 w-4 mr-2 text-emerald-500" />
                          Order Items
                        </h3>
                        <div className="rounded-lg border border-gray-200 overflow-hidden">
                          <div className="hidden md:grid md:grid-cols-12 text-xs font-medium text-gray-500 bg-gray-50 p-4">
                            <div className="md:col-span-6">Product</div>
                            <div className="md:col-span-2 text-center">
                              Price
                            </div>
                            <div className="md:col-span-2 text-center">
                              Quantity
                            </div>
                            <div className="md:col-span-2 text-right">
                              Total
                            </div>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {order.items?.map((item, index) => (
                              <div
                                key={index}
                                className="p-4 grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
                              >
                                <div className="md:col-span-6 font-medium text-gray-900">
                                  {item.name}
                                </div>
                                <div className="md:col-span-2 text-gray-600 md:text-center">
                                  <span className="md:hidden text-xs text-gray-500 mr-2">
                                    Price:
                                  </span>
                                  ${item.price.toFixed(2)}
                                </div>
                                <div className="md:col-span-2 text-gray-600 md:text-center">
                                  <span className="md:hidden text-xs text-gray-500 mr-2">
                                    Quantity:
                                  </span>
                                  {item.quantity}
                                </div>
                                <div className="md:col-span-2 font-medium text-gray-900 md:text-right">
                                  <span className="md:hidden text-xs text-gray-500 mr-2">
                                    Total:
                                  </span>
                                  ${(item.price * item.quantity).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div className="mt-6 pt-5 border-t border-slate-100">
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-slate-500">
                              Subtotal
                            </div>
                            <div className="font-medium">
                              $
                              {order.items
                                ?.reduce(
                                  (total, item) =>
                                    total + item.price * item.quantity,
                                  0
                                )
                                .toFixed(2) || "0.00"}
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <div className="text-sm text-slate-500">
                              Delivery Fee
                            </div>
                            <div className="font-medium">$0.00</div>
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                            <div className="font-medium">Total</div>
                            <div className="text-lg font-bold text-indigo-600">
                              $
                              {order.items
                                ?.reduce(
                                  (total, item) =>
                                    total + item.price * item.quantity,
                                  0
                                )
                                .toFixed(2) || "0.00"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Customer Information */}
                      <div className="p-6 border-t border-gray-100 bg-gray-50">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                          <User className="h-4 w-4 mr-2 text-emerald-500" />
                          Customer Information
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium text-gray-900">
                              {order.customerEmail}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Delivery Address
                            </p>
                            <p className="font-medium text-gray-900">
                              {order.customerAddress.street},{" "}
                              {order.customerAddress.city},
                              <br />
                              {order.customerAddress.state}{" "}
                              {order.customerAddress.zipCode},
                              <br />
                              {order.customerAddress.country}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminRoute>
  );
};

export default OrdersPage;
