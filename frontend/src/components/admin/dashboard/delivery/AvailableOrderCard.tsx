import React from 'react';
import { Order } from '@/types/order.types';

interface AvailableOrderCardProps {
  order: Order;
  onAcceptOrder: (orderId: string) => Promise<void>;
}

const AvailableOrderCard: React.FC<AvailableOrderCardProps> = ({ order, onAcceptOrder }) => {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "assigned":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "picked_up":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "delivered":
        return "bg-green-50 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path
                fill="currentColor"
                d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"
              />
              <path
                fill="currentColor"
                d="M16 10H8V8h8v2zm0 4H8v-2h8v2z"
              />
            </svg>
          </div>
          <div className="ml-2">
            <p className="font-medium text-sm">
              Order #{order.orderId}
            </p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeColor(
                order.status
              )} border inline-flex items-center`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1"></span>
              {order.status.charAt(0).toUpperCase() +
                order.status.slice(1).replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start mb-3">
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0"
          >
            <path
              fill="currentColor"
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
            />
          </svg>
          <p className="ml-2 text-sm text-gray-600">
            {order.customerAddress.street},{" "}
            {order.customerAddress.city},{" "}
            {order.customerAddress.state}{" "}
            {order.customerAddress.zipCode}
          </p>
        </div>

        <button
          onClick={() => onAcceptOrder(order.orderId)}
          className="w-full mt-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2">
            <path
              fill="currentColor"
              d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
            />
          </svg>
          Accept Delivery
        </button>
      </div>
    </div>
  );
};

export default AvailableOrderCard;