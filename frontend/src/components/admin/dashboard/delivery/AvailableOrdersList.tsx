import React from 'react';
import { Order } from '@/types/order.types';
import AvailableOrderCard from './AvailableOrderCard';

interface AvailableOrdersListProps {
  orders: Order[];
  onAcceptOrder: (orderId: string) => Promise<void>;
}

const AvailableOrdersList: React.FC<AvailableOrdersListProps> = ({ orders, onAcceptOrder }) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-blue-500">
            <path
              fill="currentColor"
              d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No Orders Available
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          There are no delivery orders available at the moment. New
          orders will appear here when they're ready for pickup.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map((order) => (
        <AvailableOrderCard 
          key={order.orderId} 
          order={order} 
          onAcceptOrder={onAcceptOrder} 
        />
      ))}
    </div>
  );
};

export default AvailableOrdersList;