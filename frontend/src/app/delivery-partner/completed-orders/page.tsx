"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { authService } from "@/services/auth.service";
import { deliveryService } from "@/services/delivery.service";
import { orderService } from "@/services/order.service";
import { DeliveryPartner, OrderItem, OrderStatus } from "@/types/order.types";
import { Order as DeliveryServiceOrder } from "@/services/delivery.service";
import { Order as OrderServiceOrder } from "@/types/order.types";

interface DeliveryOrder {
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
  items: OrderItem[];
  total: number;
  deliveryPartner?: DeliveryPartner;
  createdAt: string;
  updatedAt: string;
}

interface OrderDetails {
  _id: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: Array<{
    _id: string;
    product: {
      _id: string;
      name: string;
      price: number;
      imageUrl?: string;
    };
    quantity: number;
  }>;
  total: number;
  status: string;
  paymentStatus: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
}

interface ProcessedOrder {
  orderId: string;
  status: string;
  customerEmail: string;
  customerAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  items: {
    _id: string;
    product: {
      _id: string;
      name: string;
      price: number;
      imageUrl?: string;
    };
    quantity: number;
  }[];
  total: number;
  amount: number;
  deliveryPartner: any | null;
  createdAt: string;
  updatedAt: string;
}

export default function CompletedOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<ProcessedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const initUser = async () => {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser || currentUser.role !== "delivery_partner") {
        router.push("/delivery-partner/login");
        return;
      }
      setUser(currentUser);
    };
    initUser();
  }, [router]);

  useEffect(() => {
    if (user?.email) {
      fetchCompletedOrders();
    }
  }, [user]);

  const fetchCompletedOrders = async () => {
    try {
      console.log("Fetching completed orders for:", user.email);
      const deliveryOrders = (await deliveryService.getCompletedOrdersByPartner(
        user.email
      )) as DeliveryServiceOrder[];
      console.log("Completed orders received:", deliveryOrders);

      const processedOrders = await Promise.all(
        deliveryOrders.map(async (deliveryOrder) => {
          const orderDetails = (await orderService.getOrder(
            deliveryOrder.orderId
          )) as OrderServiceOrder;

          console.log("Order details received:", orderDetails);
          return {
            orderId: deliveryOrder.orderId,
            status: deliveryOrder.status,
            customerEmail: deliveryOrder.customerEmail,
            customerAddress: deliveryOrder.customerAddress,
            items: orderDetails.items,
            total: orderDetails.totalAmount,
            amount: orderDetails.items.reduce(
              (total, item) => total + item.product.price * item.quantity,
              0
            ),
            deliveryPartner: null,
            createdAt: deliveryOrder.createdAt,
            updatedAt: deliveryOrder.updatedAt,
          } as ProcessedOrder;
        })
      );

      setOrders(processedOrders);
    } catch (error) {
      console.error("Error fetching completed orders:", error);
      toast.error("Failed to load completed orders");
    } finally {
      setLoading(false);
    }
  };

  // Format currency helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date helper
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm p-6 animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/5 mb-6"></div>
                <div className="h-px bg-gray-200 w-full mb-4"></div>
                <div className="h-5 bg-gray-200 rounded w-1/4 mb-3"></div>
                <div className="flex justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">
            Completed Orders
          </h1>
          <div className="inline-flex items-center text-sm text-gray-500">
            <span className="mr-2">
              Total completed orders:{" "}
              <span className="font-medium text-gray-900">{orders.length}</span>
            </span>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No completed orders
            </h3>
            <p className="text-gray-500">
              You haven't completed any deliveries yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.orderId}
                className="bg-white rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                    <div>
                      <div className="flex items-center">
                        <h2 className="text-xl font-semibold text-gray-900">
                          Order #
                          {order.orderId.substring(order.orderId.length - 6)}
                        </h2>
                        <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Completed on {formatDate(order.updatedAt)}
                      </p>
                    </div>
                    <div className="mt-3 sm:mt-0">
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(order.amount)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-3">
                      Order Items
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-sm"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mr-3">
                              <span className="font-medium">
                                {item.quantity}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">
                              {item.product.name}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(item.product.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-3">
                      Delivery Address
                    </h3>
                    <div className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <p className="text-gray-700">
                        {order.customerAddress.street},{" "}
                        {order.customerAddress.city},{" "}
                        {order.customerAddress.state}{" "}
                        {order.customerAddress.zipCode}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                      onClick={() => toast.success("Order details viewed")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
