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
      console.log(
        "[Socket] No user email provided, skipping delivery socket connection"
      );
      return;
    }

    // Clean up any existing socket connection to prevent duplicate connections
    if (socket) {
      console.log(`[Socket] Cleaning up existing socket connection for (${userEmail})`);
      socket.disconnect();
      setSocket(null);
    }

    console.log(
      `[Socket] Initializing delivery socket connection for (${userEmail})`
    );

    // Use a timeout to ensure any previous socket connections have time to close
    const initSocket = setTimeout(() => {
      const newSocket = io(
        process.env.NEXT_PUBLIC_API_GATEWAY_URL || "https://thestore.pw",
        {
          path: "/socket.io",
          withCredentials: true,
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
        }
      );
      
      // Set up all event handlers on the new socket instance
      newSocket.on("connect", () => {
        console.log(
          `[Socket] Delivery socket connected successfully for (${userEmail})`
        );
        setIsConnected(true);
        newSocket.emit("delivery_partner_connected", { email: userEmail });
      });

      newSocket.on("disconnect", (reason) => {
        console.log(
          `[Socket] Delivery socket disconnected for (${userEmail}). Reason:`,
          reason
        );
        setIsConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error(
          `[Socket] Delivery socket connection error for (${userEmail}):`,
          error
        );
      });

      newSocket.on("reconnect", (attemptNumber) => {
        console.log(
          `[Socket] Delivery socket reconnected after ${attemptNumber} attempts for (${userEmail})`
        );
      });

      newSocket.on("reconnect_attempt", (attemptNumber) => {
        console.log(
          `[Socket] Attempting to reconnect delivery socket (${attemptNumber}) for (${userEmail})`
        );
      });

      newSocket.on("reconnect_error", (error) => {
        console.error(
          `[Socket] Delivery socket reconnection error for (${userEmail}):`,
          error
        );
      });

      newSocket.on("reconnect_failed", () => {
        console.error(
          `[Socket] Delivery socket reconnection failed for (${userEmail})`
        );
      });

      // Listen for new orders that need delivery
      newSocket.on("new_order", (data: Order) => {
        console.log(`[Socket] New order available for delivery:`, data);
        onNewOrder(data);
      });

      // Listen for orders that have been taken by other delivery partners
      newSocket.on("order_taken", (data: { orderId: string }) => {
        console.log(
          `[Socket] Order ${data.orderId} taken by another delivery partner`
        );
        onOrderTaken(data.orderId);
      });
      
      // Save the socket to state
      setSocket(newSocket);
    }, 500);

    return () => {
      // Clear the timeout to prevent running after component unmount
      clearTimeout(initSocket);
      
      // Disconnect any existing socket
      if (socket) {
        console.log(
          `[Socket] Cleaning up delivery socket connection for (${userEmail})`
        );
        socket.disconnect();
      }
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
