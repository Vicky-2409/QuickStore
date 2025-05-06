// src/components/delivery/CurrentOrder.tsx
import React from "react";
import { StatusBadge } from "./StatusBadge";
import { OrderProgressBar } from "./OrderProgressBar";
import { CustomerDetails } from "./CustomerDetails";
import { OrderItemsList } from "./OrderItemsList";

type Address = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
};

type OrderItem = {
  _id: string;
  product: {
    name: string;
    price: number;
  };
  quantity: number;
};

type Customer = {
  name: string;
  email: string;
  phone: string;
};

type Order = {
  orderId: string;
  status: string;
  items: OrderItem[];
  total: number;
  customerAddress: Address;
};

type CurrentOrderProps = {
  order: Order;
  customer: Customer | null;
  onUpdateStatus: (orderId: string, newStatus: string) => void;
};

export const CurrentOrder: React.FC<CurrentOrderProps> = ({
  order,
  customer,
  onUpdateStatus,
}) => {
  const getNextStatus = (currentStatus: string): string | null => {
    switch (currentStatus) {
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

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden">
      {/* Current Order Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-white text-lg font-medium flex items-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                <path
                  fill="currentColor"
                  d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"
                />
                <path fill="currentColor" d="M16 10H8V8h8v2zm0 4H8v-2h8v2z" />
              </svg>
              Current Order
            </h2>
            <div className="mt-1">
              <StatusBadge status={order.status} />
            </div>
          </div>
          <div className="flex items-center">
            <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg text-white text-sm">
              Order #{order.orderId}
            </div>
          </div>
        </div>
      </div>

      {/* Current Order Content */}
      <div className="p-6">
        <OrderProgressBar status={order.status} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Order Items
            </h3>
            <OrderItemsList items={order.items} total={order.total} />
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Amount</span>
                <span className="text-lg font-medium text-gray-900">
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Customer Details
            </h3>
            {customer ? (
              <CustomerDetails
                customer={customer}
                address={order.customerAddress}
              />
            ) : (
              <div className="text-gray-500">Loading customer details...</div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end">
          {getNextStatus(order.status) && (
            <button
              onClick={() =>
                onUpdateStatus(order.orderId, getNextStatus(order.status)!)
              }
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-lg shadow-sm hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
            >
              Update Status
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
