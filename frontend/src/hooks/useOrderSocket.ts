import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Order } from "@/types/order.types";

interface UseOrderSocketProps {
  onOrderStatusUpdate: (orderId: string, newStatus: string) => void;
  userEmail: string;
  role: "customer" | "admin" | "delivery_partner";
}

export const useOrderSocket = ({
  onOrderStatusUpdate,
  userEmail,
  role,
}: UseOrderSocketProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userEmail) {
      console.log(
        `[Socket] No ${role} email provided, skipping socket connection`
      );
      return;
    }

    // Clean up any existing socket connection to prevent duplicate connections
    if (socket) {
      console.log(`[Socket] Cleaning up existing socket connection for ${role} (${userEmail})`);
      socket.disconnect();
      setSocket(null);
    }

    console.log(
      `[Socket] Initializing socket connection for ${role} (${userEmail})`
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
        console.log(`[Socket] Connected successfully for ${role} (${userEmail})`);
        setIsConnected(true);
        newSocket.emit("user_connected", { email: userEmail, role });
      });

      newSocket.on("disconnect", (reason) => {
        console.log(
          `[Socket] Disconnected for ${role} (${userEmail}). Reason:`,
          reason
        );
        setIsConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error(
          `[Socket] Connection error for ${role} (${userEmail}):`,
          error
        );
      });

      newSocket.on("reconnect", (attemptNumber) => {
        console.log(
          `[Socket] Reconnected after ${attemptNumber} attempts for ${role} (${userEmail})`
        );
      });

      newSocket.on("reconnect_attempt", (attemptNumber) => {
        console.log(
          `[Socket] Attempting to reconnect (${attemptNumber}) for ${role} (${userEmail})`
        );
      });

      newSocket.on("reconnect_error", (error) => {
        console.error(
          `[Socket] Reconnection error for ${role} (${userEmail}):`,
          error
        );
      });

      newSocket.on("reconnect_failed", () => {
        console.error(`[Socket] Reconnection failed for ${role} (${userEmail})`);
      });

      newSocket.on(
        "order_status_updated",
        (data: { orderId: string; status: string }) => {
          console.log(
            `[Socket] Order status update received for ${role} (${userEmail}):`,
            {
              orderId: data.orderId,
              newStatus: data.status,
            }
          );
          onOrderStatusUpdate(data.orderId, data.status);
        }
      );

      // Save the socket to state
      setSocket(newSocket);
    }, 500);

    return () => {
      // Clear the timeout to prevent running after component unmount
      clearTimeout(initSocket);
      
      // Disconnect any existing socket
      if (socket) {
        console.log(
          `[Socket] Cleaning up socket connection for ${role} (${userEmail})`
        );
        socket.disconnect();
      }
    };
  }, [userEmail, role, onOrderStatusUpdate]);

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    if (socket && isConnected) {
      console.log(
        `[Socket] Emitting order status update for ${role} (${userEmail}):`,
        {
          orderId,
          newStatus,
        }
      );
      socket.emit("update_order_status", { orderId, status: newStatus });
    } else {
      console.warn(
        `[Socket] Cannot emit status update - socket is ${
          !socket ? "null" : "not connected"
        } for ${role} (${userEmail})`
      );
    }
  };

  return { socket, isConnected, updateOrderStatus };
};
