import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Order } from "@/types/order.types";

interface UseDeliverySocketProps {
  onNewOrder: (order: Order) => void;
  onOrderTaken: (orderId: string) => void;
  userEmail: string;
}

export const useDeliverySocket = ({
  onNewOrder,
  onOrderTaken,
  userEmail,
}: UseDeliverySocketProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userEmail) {
      console.log("[Socket] No user email provided, skipping delivery socket connection");
      return;
    }

    console.log(`[Socket] Initializing delivery socket connection for (${userEmail})`);

    const socket = io(
      process.env.NEXT_PUBLIC_API_GATEWAY_URL || "api-gateway-srv",
      {
        path: "/socket.io",
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }
    );

    socket.on("connect", () => {
      console.log(`[Socket] Delivery socket connected successfully for (${userEmail})`);
      setIsConnected(true);
      socket.emit("delivery_partner_connected", { email: userEmail });
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Delivery socket disconnected for (${userEmail}). Reason:`, reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error(`[Socket] Delivery socket connection error for (${userEmail}):`, error);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`[Socket] Delivery socket reconnected after ${attemptNumber} attempts for (${userEmail})`);
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`[Socket] Attempting to reconnect delivery socket (${attemptNumber}) for (${userEmail})`);
    });

    socket.on("reconnect_error", (error) => {
      console.error(`[Socket] Delivery socket reconnection error for (${userEmail}):`, error);
    });

    socket.on("reconnect_failed", () => {
      console.error(`[Socket] Delivery socket reconnection failed for (${userEmail})`);
    });

    // Listen for new orders that need delivery
    socket.on("new_order_for_delivery", (data: Order) => {
      console.log(`[Socket] New order available for delivery:`, data);
      onNewOrder(data);
    });

    // Listen for orders that have been taken by other delivery partners
    socket.on("order_taken_by_partner", (data: { orderId: string }) => {
      console.log(`[Socket] Order ${data.orderId} taken by another delivery partner`);
      onOrderTaken(data.orderId);
    });

    setSocket(socket);

    return () => {
      console.log(`[Socket] Cleaning up delivery socket connection for (${userEmail})`);
      socket.disconnect();
    };
  }, [userEmail, onNewOrder, onOrderTaken]);

  // Function to emit when a delivery partner accepts an order
  const acceptOrder = (orderId: string) => {
    if (socket && isConnected) {
      console.log(`[Socket] Emitting order acceptance for (${userEmail}):`, {
        orderId,
      });
      socket.emit("order_accepted", { orderId, partnerId: userEmail });
    } else {
      console.warn(
        `[Socket] Cannot emit order acceptance - socket is ${
          !socket ? "null" : "not connected"
        } for (${userEmail})`
      );
    }
  };

  return { socket, isConnected, acceptOrder };
};