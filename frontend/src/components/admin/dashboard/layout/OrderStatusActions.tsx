import React from 'react';
import { OrderStatus } from '@/types/order.types';

interface OrderStatusActionsProps {
  orderId: string;
  currentStatus: OrderStatus;
  onUpdateStatus: (orderId: string, newStatus: string) => Promise<void>;
}

const OrderStatusActions: React.FC<OrderStatusActionsProps> = ({
  orderId,
  currentStatus,
  onUpdateStatus,
}) => {
  const getNextStatus = (status: OrderStatus): OrderStatus | null => {
    switch (status) {
      case "pending":
        return "assigned";
      case "assigned":
        return "picked_up";
      case "picked_up":
        return "delivered";
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus(currentStatus);

  // Generate status options for dropdown
  const getStatusOptions = () => {
    if (currentStatus === 'assigned') {
      return ['picked_up', 'on_the_way', 'delivered'];
    } else if (currentStatus === 'picked_up') {
      return ['on_the_way', 'delivered'];
    } else if (currentStatus === 'on_the_way') {
      return ['delivered'];
    }
    return [];
  };

  return (
    <div className="mt-6 flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0">
      <div>
        <div className="text-sm text-gray-500 mb-2">
          Update Order Status
        </div>
        <div className="inline-block relative w-64">
          <select
            value={currentStatus}
            onChange={(e) => onUpdateStatus(orderId, e.target.value)}
            className="block appearance-none w-full bg-white border border-gray-200 hover:border-gray-300 px-4 py-2 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          >
            <option value={currentStatus}>
              {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1).replace("_", " ")}
            </option>
            {getStatusOptions().map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
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

      {nextStatus && (
        <button
          onClick={() => onUpdateStatus(orderId, nextStatus)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg shadow-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center"
        >
          {currentStatus === "assigned" && (
            <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2">
              <path
                fill="currentColor"
                d="M19 7h-8v6h8V7zm-2 4h-4V9h4v2z"
              />
              <path
                fill="currentColor"
                d="M13 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm3 16H5V5h7v5h8v9z"
              />
            </svg>
          )}
          {currentStatus === "picked_up" && (
            <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2">
              <path
                fill="currentColor"
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
              />
            </svg>
          )}
          Mark as {nextStatus.replace("_", " ")}
        </button>
      )}
    </div>
  );
};

export default OrderStatusActions;