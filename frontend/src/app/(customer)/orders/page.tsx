"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { isAuthenticated, getUser } from "@/utils/auth";
import {
  deliveryService,
  Order,
  DeliveryPartner,
} from "@/services/delivery.service";
import { orderService } from "@/services/order.service";
import { authService } from "@/services/auth.service";
import { useOrderSocket } from "@/hooks/useOrderSocket";
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
  ArrowLeft,
} from "lucide-react";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface ProcessedOrder extends Omit<Order, "deliveryPartner"> {
  items: OrderItem[];
  deliveryPartner: DeliveryPartner | null;
  amount: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<ProcessedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    const initUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        console.log("[Orders] Current user loaded:", currentUser);
        setUser(currentUser);
      } catch (error) {
        console.error("[Orders] Error loading user:", error);
      }
    };
    initUser();
  }, []);

  const handleOrderStatusUpdate = useCallback(
    (orderId: string, newStatus: string) => {
      console.log(
        `[Orders] Received status update for order ${orderId}:`,
        newStatus
      );
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.orderId === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast.success(`Order #${orderId} status updated to ${newStatus}`);
    },
    []
  );

  // Initialize socket connection only when user is loaded
  const { socket, isConnected } = useOrderSocket({
    onOrderStatusUpdate: handleOrderStatusUpdate,
    userEmail: user?.email || "",
    role: "customer",
  });

  // Log socket connection status and events
  useEffect(() => {
    if (socket) {
      console.log(`[Orders] Customer socket connection status:`, {
        connected: isConnected,
        email: user?.email,
      });

      // Add additional event listeners for debugging
      socket.on("order_status_updated", (data) => {
        console.log("[Orders] Raw order status update received:", data);
      });

      socket.on("connect", () => {
        console.log("[Orders] Socket connected successfully");
      });

      socket.on("disconnect", (reason) => {
        console.log("[Orders] Socket disconnected:", reason);
      });

      socket.on("connect_error", (error) => {
        console.error("[Orders] Socket connection error:", error);
      });
    }
  }, [socket, isConnected, user?.email]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      console.log("Starting to fetch orders...");
      const user = await authService.getCurrentUser();
      console.log("User details:", user);

      if (!user) {
        console.log("No user found");
        return;
      }

      console.log("Fetching orders for email:", user.email);
      const deliveryOrders = await deliveryService.getOrdersByCustomerEmail(
        user.email
      );
      console.log("Delivery orders received:", deliveryOrders);

      const processedOrders = await Promise.all(
        deliveryOrders.map(async (deliveryOrder) => {
          console.log("Processing order:", deliveryOrder.orderId);
          const orderDetails = await orderService.getOrder(
            deliveryOrder.orderId
          );
          console.log("Order details received:", orderDetails);

          let deliveryPartner: DeliveryPartner | null = null;
          if (deliveryOrder.deliveryPartner) {
            console.log(
              "Fetching partner details for email:",
              deliveryOrder.deliveryPartner
            );
            try {
              deliveryPartner = await deliveryService.getDeliveryPartner(
                deliveryOrder.deliveryPartner.email
              );
              console.log("Partner details received:", deliveryPartner);
            } catch (error) {
              console.error("Error fetching partner details:", error);
            }
          }

          const processedOrder: ProcessedOrder = {
            ...deliveryOrder,
            items: orderDetails.items.map((item) => ({
              productId: item.product._id,
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
            })),
            deliveryPartner,
            amount: orderDetails.items.reduce(
              (total, item) => total + item.product.price * item.quantity,
              0
            ),
          };
          console.log("Final order object:", processedOrder);
          return processedOrder;
        })
      );

      console.log("All orders processed:", processedOrders);
      setOrders(processedOrders);
    } catch (error) {
      console.error("Error in fetchOrders:", error);
      toast.error("Failed to load orders");
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
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
    }).format(date);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-100 rounded w-1/4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push("/")}
            className="flex items-center text-gray-500 hover:text-emerald-500 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            <span>Back to Shop</span>
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <Package className="h-6 w-6 text-emerald-500" />
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="flex justify-center mb-4">
            <ShoppingBag className="h-16 w-16 text-gray-300" />
          </div>
          <h2 className="text-xl font-medium text-gray-700 mb-2">
            No Orders Found
          </h2>
          <p className="text-gray-500 mb-6">
            You haven't placed any orders yet.
          </p>
          <button
            onClick={() => router.push("/shop")}
            className="px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.orderId}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200"
            >
              {/* Order Header - Always visible */}
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
                        <span>
                          {formatDate(
                            order.createdAt || new Date().toISOString()
                          )}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <ShoppingBag className="h-4 w-4 mr-1" />
                        <span>{order.items.length} items</span>
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
                        <div className="md:col-span-2 text-center">Price</div>
                        <div className="md:col-span-2 text-center">
                          Quantity
                        </div>
                        <div className="md:col-span-2 text-right">Total</div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {order.items.map((item, index) => (
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
                    <div className="mt-6 border-t border-gray-100 pt-4">
                      <div className="flex justify-end">
                        <div className="w-full md:w-72">
                          <div className="flex justify-between text-gray-600 text-sm mb-2">
                            <span>Subtotal</span>
                            <span>${order.amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-gray-600 text-sm mb-2">
                            <span>Shipping</span>
                            <span>Free</span>
                          </div>
                          <div className="flex justify-between font-medium text-gray-900 text-base pt-2 border-t border-gray-100">
                            <span>Total</span>
                            <span>${order.amount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Partner Info */}
                  {order.deliveryPartner && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50">
                      <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                        <Truck className="h-4 w-4 mr-2 text-emerald-500" />
                        Delivery Information
                      </h3>
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {order.deliveryPartner.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Delivery Partner
                            </p>
                          </div>
                        </div>

                        <a
                          href={`tel:${order.deliveryPartner.phone}`}
                          className="flex items-center space-x-2 text-emerald-500 hover:text-emerald-600 transition-colors ml-0 md:ml-auto"
                        >
                          <Phone className="h-4 w-4" />
                          <span>{order.deliveryPartner.phone}</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
