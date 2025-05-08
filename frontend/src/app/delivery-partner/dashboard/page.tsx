"use client";

import React, { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { authService } from "@/services/auth.service";
import { getUser, isAuthenticated } from "@/utils/auth";
import { orderService } from "@/services/order.service";
import { UserService } from "@/services/userService";
import { useDeliverySocket } from "@/hooks/useDeliverySocket";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import {
  Order,
  OrderStatus,
  OrderItem,
  AvailableOrder,
} from "@/types/order.types";
import {
  setCurrentOrder,
  setAvailableOrders,
  removeAvailableOrder,
  setLoading,
  setError,
  clearOrders,
} from "@/store/slices/deliverySlice";
import { RootState } from "@/store/store";
import { Customer } from "@/types/user.types";
import { deliveryService } from "@/services/delivery.service";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  vehicleType: string;
  vehicleNumber: string;
}

export default function DeliveryPartnerDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { currentOrder, availableOrders, isLoading } = useSelector(
    (state: RootState) => state.delivery
  );
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [disabledStatuses, setDisabledStatuses] = useState<string[]>([]);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  const handleNewOrder = useCallback(
    async (data: Order) => {
      try {
        const order = await orderService.getOrder(data._id);
        if (order && !currentOrder) {
          // Display a notification for new order
          toast.success("New order available!", {
            icon: "🚚",
            duration: 4000,
          });
        }
      } catch (error) {
        console.error("Error fetching new order:", error);
      }
    },
    [currentOrder, dispatch]
  );

  const handleOrderTaken = useCallback(
    (orderId: string) => {
      dispatch(removeAvailableOrder(orderId));
    },
    [dispatch]
  );

  const handleOrderStatusUpdate = useCallback(
    (orderId: string, newStatus: string) => {
      if (currentOrder && currentOrder.orderId === orderId) {
        dispatch(
          setCurrentOrder({ ...currentOrder, status: newStatus as OrderStatus })
        );

        // Update the disabled statuses based on the new status
        if (newStatus === "picked_up") {
          setDisabledStatuses(["assigned"]);
        } else if (newStatus === "on_the_way") {
          setDisabledStatuses(["assigned", "picked_up"]);
        }
      }
    },
    [currentOrder, dispatch]
  );

  const { socket: deliverySocket, isConnected: isDeliveryConnected } =
    useDeliverySocket({
      onNewOrder: handleNewOrder,
      onOrderTaken: handleOrderTaken,
      userEmail: isUserLoaded ? user?.email || "" : "",
    });

  const { updateOrderStatus } = useOrderSocket({
    onOrderStatusUpdate: handleOrderStatusUpdate,
    userEmail: isUserLoaded ? user?.email || "" : "",
    role: "delivery_partner",
  });

  const fetchCustomerDetails = async (email: string) => {
    if (!email) {
      console.log("No email provided for customer details");
      return;
    }
    try {
      setIsLoadingCustomer(true);
      setCustomerError(null);
      const customerData = await UserService.getUserByEmail(email);
      setCustomer(customerData);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      setCustomerError("Failed to load customer details");
      setCustomer(null);
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = isAuthenticated();
        console.log("isAuth", isAuth);
        if (!isAuth) {
          router.push("/delivery-partner/login");
          return;
        }

        const currentUser = getUser();
        console.log("Current user object:", currentUser);

        if (!currentUser || !currentUser.email) {
          console.log("No user data or email found");
          router.push("/delivery-partner/login");
          return;
        }

        if (currentUser.role !== "delivery_partner") {
          console.log("User is not a delivery partner");
          router.push("/delivery-partner/login");
          return;
        }

        setUser(currentUser as User);
        setIsUserLoaded(true);
        dispatch(setLoading(true));

        // Fetch current order if any
        try {
          const email = currentUser.email;
          console.log("Fetching active order for email:", email);
          try {
            const activeOrderResponse = await orderService.getActiveOrder(
              email
            );
            console.log("Active order response:", activeOrderResponse);

            if (activeOrderResponse && activeOrderResponse.orderId) {
              // Get full order details using the orderId
              const orderId = activeOrderResponse.orderId;
              console.log("Fetching order details for ID:", orderId);

              try {
                const orderDetails = await orderService.getOrderById(orderId);
                console.log("Order details fetched:", orderDetails);

                // Ensure we have a valid order with all required fields
                const safeOrder = {
                  ...orderDetails,
                  orderId: activeOrderResponse.orderId ||orderDetails.orderId || orderDetails._id || orderId,
                  status: activeOrderResponse.status || orderDetails.status || "pending",
                  items: orderDetails.items || [],
                  customerAddress: activeOrderResponse.address || orderDetails.address || {
                    street: "",
                    city: "",
                    state: "",
                    zipCode: "",
                    country: "",
                  },
                  customerEmail: orderDetails.userEmail || "",
                };

                console.log("Dispatching setCurrentOrder with:", safeOrder);
                dispatch(setCurrentOrder(safeOrder));

                if (safeOrder.customerEmail) {
                  await fetchCustomerDetails(safeOrder.customerEmail);
                }

                // Set disabled statuses based on current order status
                if (safeOrder.status === "picked_up") {
                  setDisabledStatuses(["assigned"]);
                } else if (safeOrder.status === "on_the_way") {
                  setDisabledStatuses(["assigned", "picked_up"]);
                }
              } catch (orderDetailError) {
                console.error(
                  "Failed to fetch order details:",
                  orderDetailError
                );
                // Fallback: Use the base activeOrderResponse
                const safeOrder = {
                  ...activeOrderResponse,
                  orderId:
                    activeOrderResponse.orderId ||
                    activeOrderResponse._id ||
                    "",
                  status: activeOrderResponse.status || "pending",
                  items: activeOrderResponse.items || [],
                  customerAddress: activeOrderResponse.address || {
                    street: "",
                    city: "",
                    state: "",
                    zipCode: "",
                    country: "",
                  },
                  customerEmail: activeOrderResponse.userEmail || "",
                };

                console.log(
                  "Dispatching setCurrentOrder with fallback:",
                  safeOrder
                );
                dispatch(setCurrentOrder(safeOrder));

                if (safeOrder.customerEmail) {
                  await fetchCustomerDetails(safeOrder.customerEmail);
                }

                // Set disabled statuses based on current order status
                if (safeOrder.status === "picked_up") {
                  setDisabledStatuses(["assigned"]);
                } else if (safeOrder.status === "on_the_way") {
                  setDisabledStatuses(["assigned", "picked_up"]);
                }
              }
            } else {
              console.log("No active order found, fetching available orders");
              const availableOrders = await orderService.getPendingOrders();
              console.log("Available orders:", availableOrders);
              if (availableOrders && availableOrders.length > 0) {
                const ordersWithDetails = await Promise.all(
                  availableOrders.map(async (order: Order) => {
                    const orderId = order.orderId || order._id;
                    const orderDetails = await orderService.getOrder(
                      orderId
                    );
                    return {
                      orderId: order.orderId,
                      items: orderDetails.items,
                      total: orderDetails.total,
                      customerEmail: orderDetails.userEmail,
                      customerAddress: orderDetails.address,
                      status: orderDetails.status,
                      createdAt: orderDetails.createdAt,
                      updatedAt: orderDetails.updatedAt,
                    } as AvailableOrder;
                  })
                );
                console.log("Orders with details:", ordersWithDetails);
                dispatch(setAvailableOrders(ordersWithDetails));
              }
            }
          } catch (error) {
            console.error("Error fetching active order:", error);
            console.log("No active order found, fetching available orders");
            const availableOrders = await orderService.getPendingOrders();
            console.log("Available orders:", availableOrders);
            if (availableOrders && availableOrders.length > 0) {
              const ordersWithDetails = await Promise.all(
                availableOrders.map(async (order: Order) => {
                  const orderId = order.orderId || order._id;
                  const orderDetails = await orderService.getOrder(
                    orderId
                  );
                  return {
                    orderId: order.orderId,
                    items: orderDetails.items,
                    total: orderDetails.total,
                    customerEmail: orderDetails.userEmail,
                    customerAddress: orderDetails.address,
                    status: orderDetails.status,
                    createdAt: orderDetails.createdAt,
                    updatedAt: orderDetails.updatedAt,
                  } as AvailableOrder;
                })
              );
              dispatch(setAvailableOrders(ordersWithDetails));
            }
          }
        } catch (error) {
          console.error("Error fetching orders:", error);
          dispatch(setError("Failed to fetch orders"));
        } finally {
          dispatch(setLoading(false));
        }
      } catch (error) {
        console.error("Error in checkAuth:", error);
        router.push("/delivery-partner/login");
      }
    };

    checkAuth();
  }, [dispatch, router]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(clearOrders());
      router.push("/delivery-partner/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!deliverySocket || !user) return;

    try {
      toast.loading("Accepting order...", { id: "acceptOrder" });
      const order = await orderService.assignDeliveryPartner(
        orderId,
        user.email
      );
      console.log("[Delivery] Order assigned:", order);

      dispatch(setCurrentOrder(order));
      console.log("removeAvailableOrder", order._id);

      dispatch(removeAvailableOrder(order._id));

      // Emit both events
      deliverySocket.emit("accept_order", { orderId, partnerId: user.email });

      // Also emit the order status update
      console.log("[Delivery] Emitting initial order status update:", {
        orderId,
        status: "assigned",
        userEmail: user.email,
      });
      updateOrderStatus(orderId, "assigned");

      toast.success("Order accepted successfully!", { id: "acceptOrder" });
      await fetchCustomerDetails(user.email);
      // Reset disabled statuses when accepting a new order
      setDisabledStatuses([]);
    } catch (error) {
      console.error("Error accepting order:", error);
      toast.error("Failed to accept order", { id: "acceptOrder" });
    }
  };

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    if (!user?.email) {
      toast.error("User email not found");
      return;
    }

    try {
      toast.loading("Updating order status...", { id: "updateStatus" });

      // Update order status in the backend
      await orderService.updateOrderStatus(orderId, newStatus);

      // Update local state
      dispatch(
        setCurrentOrder({
          ...currentOrder!,
          status: newStatus,
        })
      );

      // Emit socket event
      updateOrderStatus(orderId, newStatus);

      // Update disabled statuses
      if (newStatus === "picked_up") {
        setDisabledStatuses(["assigned"]);
      } else if (newStatus === "on_the_way") {
        setDisabledStatuses(["assigned", "picked_up"]);
      }

      toast.success("Order status updated successfully", {
        id: "updateStatus",
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status", {
        id: "updateStatus",
      });
    }
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    if (!currentStatus) return null;

    const statusFlow: Record<OrderStatus, OrderStatus | null> = {
      pending: "assigned",
      assigned: "picked_up",
      picked_up: "on_the_way",
      on_the_way: "delivered",
      delivered: null,
    };

    return statusFlow[currentStatus] || null;
  };

  const getStatusBadgeColor = (status: string) => {
    if (!status) return "bg-gray-500";

    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      assigned: "bg-blue-500",
      picked_up: "bg-indigo-500",
      on_the_way: "bg-purple-500",
      delivered: "bg-green-500",
    };

    return colors[status] || "bg-gray-500";
  };

  const getProgressPercentage = (status: string) => {
    if (!status) return 0;

    const percentages: Record<string, number> = {
      pending: 0,
      assigned: 25,
      picked_up: 50,
      on_the_way: 75,
      delivered: 100,
    };

    return percentages[status] || 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-bl from-slate-50 to-indigo-50">
        <div className="relative flex flex-col items-center">
          <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-indigo-500 animate-spin"></div>
          <div
            className="absolute top-0 left-0 h-16 w-16 rounded-full border-t-4 border-b-4 border-blue-300 animate-spin opacity-70"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          ></div>
          <p className="mt-4 text-slate-600 font-medium">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center mr-3">
                  <svg
                    className="w-6 h-6 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M20 11H4C3.44772 11 3 11.4477 3 12V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V12C21 11.4477 20.5523 11 20 11Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M12 14V17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-800">
                  Swift<span className="text-indigo-600">Dash</span>
                </h1>
              </div>
              {!isDeliveryConnected && (
                <span className="ml-4 text-rose-500 text-xs px-2 py-1 rounded-full bg-rose-50 border border-rose-100 flex items-center">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-1 animate-pulse"></span>
                  Offline
                </span>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md p-1"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <svg
                  className="w-4 h-4 text-indigo-500"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M8 19L8 7C8 5.93913 8.42143 4.92172 9.17157 4.17157C9.92172 3.42143 10.9391 3 12 3C13.0609 3 14.0783 3.42143 14.8284 4.17157C15.5786 4.92172 16 5.93913 16 7V19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 19H19C20.1046 19 21 19.8954 21 21H3C3 19.8954 3.89543 19 5 19Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-medium">{user.vehicleType}</span>
                <span className="text-slate-300">|</span>
                <span>{user.vehicleNumber}</span>
              </div>
              <div className="flex items-center space-x-6">
                <Link
                  href="/delivery-partner/completed-orders"
                  className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center group"
                >
                  <svg
                    className="w-5 h-5 mr-1.5 text-slate-400 group-hover:text-indigo-500 transition-colors"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M9 16.2L4.8 12L3.4 13.4L9 19L21 7L19.6 5.6L9 16.2Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="font-medium text-sm">History</span>
                </Link>
                <Link
                  href="/delivery-partner/profile"
                  className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center group"
                >
                  <svg
                    className="w-5 h-5 mr-1.5 text-slate-400 group-hover:text-indigo-500 transition-colors"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="font-medium text-sm">Profile</span>
                </Link>
              </div>
              <div className="flex items-center pl-4 border-l border-slate-100">
                <div className="mr-3 text-right">
                  <p className="text-sm font-medium text-slate-700 leading-tight">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-slate-500 truncate max-w-[120px]">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 text-white flex items-center justify-center font-medium text-sm shadow-sm">
                  {user && user.name && user.name.length > 0
                    ? user.name.charAt(0).toUpperCase()
                    : "U"}
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-4 text-slate-600 hover:text-slate-900 p-1"
                  title="Logout"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 17L21 12L16 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21 12H9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white pt-2 pb-3 border-t border-slate-100">
            <div className="px-4 space-y-3">
              <div className="flex items-center space-x-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                <svg
                  className="w-4 h-4 text-indigo-500"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M8 19L8 7C8 5.93913 8.42143 4.92172 9.17157 4.17157C9.92172 3.42143 10.9391 3 12 3C13.0609 3 14.0783 3.42143 14.8284 4.17157C15.5786 4.92172 16 5.93913 16 7V19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 19H19C20.1046 19 21 19.8954 21 21H3C3 19.8954 3.89543 19 5 19Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-medium">{user.vehicleType}</span>
                <span className="text-slate-300">|</span>
                <span>{user.vehicleNumber}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <Link
                  href="/delivery-partner/completed-orders"
                  className="text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors flex items-center px-3 py-2 rounded-md"
                >
                  <svg
                    className="w-5 h-5 mr-2 text-slate-400"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M9 16.2L4.8 12L3.4 13.4L9 19L21 7L19.6 5.6L9 16.2Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="font-medium">Completed Orders</span>
                </Link>
                <Link
                  href="/delivery-partner/profile"
                  className="text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors flex items-center px-3 py-2 rounded-md"
                >
                  <svg
                    className="w-5 h-5 mr-2 text-slate-400"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="font-medium">Profile</span>
                </Link>
              </div>
              <div className="flex items-center py-2">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 text-white flex items-center justify-center font-medium">
                  {user && user.name && user.name.length > 0
                    ? user.name.charAt(0).toUpperCase()
                    : "U"}
                </div>
                <div className="ml-3">
                  <p className="font-medium text-slate-700">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
              </div>
              <div>
                <button
                  onClick={handleLogout}
                  className="w-full text-slate-700 px-4 py-2 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center"
                >
                  <span className="font-medium">Logout</span>
                  <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 17L21 12L16 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21 12H9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {currentOrder &&
        currentOrder.status !== ("delivered" as OrderStatus) ? (
          <div className="bg-white shadow-md rounded-xl overflow-hidden border border-slate-100">
            {/* Current Order Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-5">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-white text-lg font-medium flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M22 12H2M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 8V16M15 12H9"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Active Delivery
                  </h2>
                  <div className="mt-1 flex items-center space-x-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full ${getStatusBadgeColor(
                        currentOrder.status
                      )} border font-medium flex items-center`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                      {currentOrder.status.charAt(0).toUpperCase() +
                        currentOrder.status.slice(1).replace(/_/g, " ")}
                    </span>
                    <span className="text-white/70 text-xs">
                      {new Date().toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-sm font-medium">
                    #{ currentOrder.orderId ? currentOrder.orderId.slice(-6) : currentOrder._id.slice(-6)}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Order Content */}
            <div className="p-6">
              {/* Status Progress Bar */}
              <div className="mb-8">
                <div className="relative pt-1">
                  <div className="flex mb-3 items-center justify-between">
                    <div className="text-xs font-semibold inline-block uppercase text-indigo-600">
                      Delivery Progress
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-indigo-600">
                        {getProgressPercentage(currentOrder.status)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-slate-100">
                    <div
                      style={{
                        width: `${getProgressPercentage(currentOrder.status)}%`,
                      }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500 ease-in-out"
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <div
                    className={`flex flex-col items-center ${
                      currentOrder.status === "assigned" ||
                      currentOrder.status === "picked_up" ||
                      currentOrder.status === "on_the_way" ||
                      currentOrder.status === "delivered"
                        ? "text-indigo-600"
                        : "text-slate-400"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 mb-1 rounded-full flex items-center justify-center ${
                        currentOrder.status === "assigned" ||
                        currentOrder.status === "picked_up" ||
                        currentOrder.status === "on_the_way" ||
                        currentOrder.status === "delivered"
                          ? "bg-indigo-100"
                          : "bg-slate-100"
                      }`}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 12H15M12 16H15M9 12H9.01M9 16H9.01"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M9 3H15V7H9V3Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="text-xs font-medium">Assigned</span>
                  </div>

                  <div
                    className={`flex flex-col items-center ${
                      currentOrder.status === "picked_up" ||
                      currentOrder.status === "on_the_way" ||
                      currentOrder.status === "delivered"
                        ? "text-indigo-600"
                        : "text-slate-400"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 mb-1 rounded-full flex items-center justify-center ${
                        currentOrder.status === "picked_up" ||
                        currentOrder.status === "on_the_way" ||
                        currentOrder.status === "delivered"
                          ? "bg-indigo-100"
                          : "bg-slate-100"
                      }`}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M5 12H5.01M12 12H12.01M19 12H19.01M6 12C6 12.5523 5.55228 13 5 13C4.44772 13 4 12.5523 4 12C4 11.4477 4.44772 11 5 11C5.55228 11 6 11.4477 6 12ZM13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12ZM20 12C20 12.5523 19.5523 13 19 13C18.4477 13 18 12.5523 18 12C18 11.4477 18.4477 11 19 11C19.5523 11 20 11.4477 20 12Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="text-xs font-medium">Picked Up</span>
                  </div>

                  <div
                    className={`flex flex-col items-center ${
                      currentOrder.status === "on_the_way" ||
                      currentOrder.status === "delivered"
                        ? "text-indigo-600"
                        : "text-slate-400"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 mb-1 rounded-full flex items-center justify-center ${
                        currentOrder.status === "on_the_way" ||
                        currentOrder.status === "delivered"
                          ? "bg-indigo-100"
                          : "bg-slate-100"
                      }`}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M13 4V16M13 16L17 12M13 16L9 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21 14H19M19 14C19 15.6569 17.6569 17 16 17H8C6.34315 17 5 15.6569 5 14C5 12.3431 6.34315 11 8 11H16C17.6569 11 19 12.3431 19 14ZM9 14H15"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="text-xs font-medium">On The Way</span>
                  </div>

                  <div
                    className={`flex flex-col items-center ${
                      currentOrder.status === "delivered"
                        ? "text-indigo-600"
                        : "text-slate-400"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 mb-1 rounded-full flex items-center justify-center ${
                        currentOrder.status === "delivered"
                          ? "bg-indigo-100"
                          : "bg-slate-100"
                      }`}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="text-xs font-medium">Delivered</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Customer Information */}
                <div className="md:col-span-1 bg-slate-50 rounded-lg p-5 border border-slate-100">
                  <h3 className="font-medium text-slate-800 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-indigo-500"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 21H8C5.79086 21 4 19.2091 4 17C4 13.5 7.58172 11 12 11C16.4183 11 20 13.5 20 17C20 19.2091 18.2091 21 16 21Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Customer Details
                  </h3>

                  {isLoadingCustomer ? (
                    <div className="animate-pulse">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-slate-200"></div>
                        <div className="ml-3">
                          <div className="h-4 bg-slate-200 rounded w-24 mb-1"></div>
                          <div className="h-3 bg-slate-200 rounded w-32"></div>
                        </div>
                      </div>
                      <div className="h-10 bg-slate-200 rounded w-full mt-4"></div>
                      <div className="h-20 bg-slate-200 rounded w-full mt-4"></div>
                    </div>
                  ) : customerError ? (
                    <div className="text-center py-4">
                      <div className="text-rose-500 mb-2">
                        <svg
                          className="w-8 h-8 mx-auto"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <p className="text-slate-600">{customerError}</p>
                    </div>
                  ) : customer ? (
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center font-medium text-lg shadow-sm">
                          {customer && customer.name && customer.name.length > 0
                            ? customer.name.charAt(0).toUpperCase()
                            : "C"}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-slate-800">
                            {customer.name || "Customer"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {customer.email || "No email available"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-slate-600 mt-2 p-3 bg-white rounded-md border border-slate-100">
                        <svg
                          className="w-4 h-4 mr-3 text-indigo-500 flex-shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M15 9C15 10.6569 13.6569 12 12 12C10.3431 12 9 10.6569 9 9C9 7.34315 10.3431 6 12 6C13.6569 6 15 7.34315 15 9Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M6.16797 18.849C6.41954 16.9252 8.04379 15.5 9.99996 15.5H14C15.956 15.5 17.5802 16.9249 17.832 18.8487"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex-1">
                          <p className="text-slate-700 font-medium">
                            {customer.phone || "Not provided"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Customer Phone
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 mt-3">
                        <h4 className="text-xs font-medium uppercase text-slate-500 mb-2">
                          Delivery Address
                        </h4>
                        <div className="p-3 bg-white rounded-md border border-slate-100 flex">
                          <svg
                            className="w-5 h-5 mr-3 text-indigo-500 flex-shrink-0 mt-0.5"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M17.6569 16.6569C16.7202 17.5935 14.7616 19.5521 13.4138 20.8999C12.6327 21.681 11.3677 21.6814 10.5866 20.9003C9.26234 19.576 7.34159 17.6553 6.34315 16.6569C3.21895 13.5327 3.21895 8.46734 6.34315 5.34315C9.46734 2.21895 14.5327 2.21895 17.6569 5.34315C20.781 8.46734 20.781 13.5327 17.6569 16.6569Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M15 11C15 12.6569 13.6569 14 12 14C10.3431 14 9 12.6569 9 11C9 9.34315 10.3431 8 12 8C13.6569 8 15 9.34315 15 11Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div>
                            {currentOrder.address && (
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {currentOrder.address.street},<br />
                                {currentOrder.address.city},{" "}
                                {currentOrder.address.state}{" "}
                                {currentOrder.address.zipCode}
                              </p>
                            )}
                            {!currentOrder.address && (
                              <p className="text-sm text-slate-700 leading-relaxed">
                                No address available
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-slate-500">
                      <p>No customer details available</p>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="md:col-span-2 bg-white rounded-lg p-5 border border-slate-100">
                  <h3 className="font-medium text-slate-800 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-indigo-500"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M9 11H15M9 7H15M9 15H13M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V19C19 20.1046 18.1046 21 17 21Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Order Items
                  </h3>

                  {currentOrder.items && currentOrder.items.length > 0 ? (
                    <div className="space-y-3">
                      {currentOrder.items.map((item: OrderItem) => (
                        <div
                          key={item._id}
                          className="flex justify-between items-center p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
                              <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <path
                                  d="M20 7L12 3L4 7M20 7V17L12 21M20 7L12 11M12 21L4 17V7M12 21V11M4 7L12 11"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-slate-800">
                                {item.product.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                Quantity: {item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="font-medium text-indigo-600">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}

                      <div className="mt-6 pt-5 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-slate-500">Subtotal</div>
                          <div className="font-medium">
                            ${currentOrder.total?.toFixed(2) || "0.00"}
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
                            ${currentOrder.total?.toFixed(2) || "0.00"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
                      <svg
                        className="w-10 h-10 mx-auto text-slate-300 mb-3"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p>No items found in this order</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:justify-between space-y-4 sm:space-y-0">
                  <div>
                    <div className="text-sm text-slate-700 font-medium mb-2">
                      Update Order Status
                    </div>
                    <div className="inline-block relative">
                      <select
                        value={currentOrder.status}
                        onChange={(e) =>
                          handleUpdateStatus(
                            currentOrder.orderId || "",
                            e.target.value as OrderStatus
                          )
                        }
                        disabled={currentOrder.status === "delivered"}
                        className="block appearance-none w-full bg-white border border-slate-200 hover:border-indigo-300 px-4 py-2 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <option
                          value="assigned"
                          disabled={disabledStatuses.includes("assigned")}
                        >
                          Assigned
                        </option>
                        <option
                          value="picked_up"
                          disabled={disabledStatuses.includes("picked_up")}
                        >
                          Picked Up
                        </option>
                        <option
                          value="on_the_way"
                          disabled={disabledStatuses.includes("on_the_way")}
                        >
                          On the way
                        </option>
                        <option value="delivered">Delivered</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                        <svg
                          className="fill-current h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {getNextStatus(currentOrder.status) && (
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          currentOrder.orderId || "",
                          getNextStatus(currentOrder.status)!
                        )
                      }
                      disabled={currentOrder.status === "delivered"}
                      className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-6 py-2.5 rounded-lg shadow-sm hover:from-indigo-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {currentOrder.status === "assigned" && (
                        <svg
                          className="w-5 h-5 mr-2"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      {currentOrder.status === "picked_up" && (
                        <svg
                          className="w-5 h-5 mr-2"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M13 4V16M13 16L17 12M13 16L9 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M21 14H19M19 14C19 15.6569 17.6569 17 16 17H8C6.34315 17 5 15.6569 5 14C5 12.3431 6.34315 11 8 11H16C17.6569 11 19 12.3431 19 14ZM9 14H15"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      {currentOrder.status === "on_the_way" && (
                        <svg
                          className="w-5 h-5 mr-2"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      Mark as{" "}
                      {getNextStatus(currentOrder.status)?.replace(/_/g, " ")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-xl overflow-hidden border border-slate-100">
            {/* Available Orders Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-5">
              <h2 className="text-white text-lg font-medium flex items-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 12H15M12 16H15M9 12H9.01M9 16H9.01"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Available Orders
              </h2>
            </div>

            {/* Available Orders Content */}
            <div className="p-6">
              {availableOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-indigo-500"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M15 17H20L18.5951 15.5951C18.2141 15.2141 18 14.6973 18 14.1585V11C18 8.38757 16.3304 6.16509 14 5.34142V5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5V5.34142C7.66962 6.16509 6 8.38757 6 11V14.1585C6 14.6973 5.78595 15.2141 5.40493 15.5951L4 17H9M15 17V18C15 19.6569 13.6569 21 12 21C10.3431 21 9 19.6569 9 18V17M15 17H9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-800 mb-2">
                    No Orders Available
                  </h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    There are no delivery orders available at the moment. When
                    new orders come in, they'll appear here ready for pickup.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableOrders.map((order: AvailableOrder) => (
                    <div
                      key={order.orderId}
                      className="border border-slate-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200 bg-white"
                    >
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M12 12H15M12 16H15M9 12H9.01M9 16H9.01"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <div className="ml-2">
                            <p className="font-medium text-sm text-slate-800">
                              Order #{order.orderId.slice(-6)}
                            </p>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeColor(
                                order.status
                              )} border inline-flex items-center`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1"></span>
                              {order.status.charAt(0).toUpperCase() +
                                order.status.slice(1).replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date().toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start mb-4">
                          <svg
                            className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M17.6569 16.6569C16.7202 17.5935 14.7616 19.5521 13.4138 20.8999C12.6327 21.681 11.3677 21.6814 10.5866 20.9003C9.26234 19.576 7.34159 17.6553 6.34315 16.6569C3.21895 13.5327 3.21895 8.46734 6.34315 5.34315C9.46734 2.21895 14.5327 2.21895 17.6569 5.34315C20.781 8.46734 20.781 13.5327 17.6569 16.6569Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M15 11C15 12.6569 13.6569 14 12 14C10.3431 14 9 12.6569 9 11C9 9.34315 10.3431 8 12 8C13.6569 8 15 9.34315 15 11Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <p className="ml-2 text-sm text-slate-600 line-clamp-2">
                            {order.customerAddress?.street || "N/A"},{" "}
                            {order.customerAddress?.city || "N/A"},{" "}
                            {order.customerAddress?.state || "N/A"}{" "}
                            {order.customerAddress?.zipCode || "N/A"}
                          </p>
                        </div>

                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-3">
                            {order.items.map((item: OrderItem) => (
                              <div
                                key={item._id}
                                className="flex justify-between items-center p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <svg
                                      className="h-5 w-5"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                    >
                                      <path
                                        d="M20 7L12 3L4 7M20 7V17L12 21M20 7L12 11M12 21L4 17V7M12 21V11M4 7L12 11"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </div>
                                  <div className="ml-3">
                                    <p className="font-medium text-slate-800">
                                      {item.product.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Quantity: {item.quantity}
                                    </p>
                                  </div>
                                </div>
                                <div className="font-medium text-indigo-600">
                                  $
                                  {(item.product.price * item.quantity).toFixed(
                                    2
                                  )}
                                </div>
                              </div>
                            ))}

                            <div className="mt-6 pt-5 border-t border-slate-100">
                              <div className="flex justify-between items-center">
                                <div className="text-sm text-slate-500">
                                  Subtotal
                                </div>
                                <div className="font-medium">
                                  ${order.total?.toFixed(2) || "0.00"}
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
                                  ${order.total?.toFixed(2) || "0.00"}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
                            <svg
                              className="w-10 h-10 mx-auto text-slate-300 mb-3"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <p>No items found in this order</p>
                          </div>
                        )}

                        <div className="flex items-center mb-3 text-sm text-slate-700">
                          <svg
                            className="w-4 h-4 mr-2 text-slate-400"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Est. {Math.floor(Math.random() * 20) + 10}-
                          {Math.floor(Math.random() * 20) + 30} min
                        </div>

                        <div className="flex items-center justify-between text-sm mb-4">
                          <div className="text-slate-500">
                            <span className="font-medium text-slate-700">
                              {order.items ? order.items.length : 0}
                            </span>{" "}
                            items
                          </div>
                          <div className="font-medium text-indigo-600">
                            ${order.total?.toFixed(2) || "0.00"}
                          </div>
                        </div>

                        <button
                          onClick={() => handleAcceptOrder(order.orderId)}
                          className="w-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-medium px-4 py-2 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-200 flex items-center justify-center"
                        >
                          <svg
                            className="w-5 h-5 mr-2"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Accept Delivery
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
