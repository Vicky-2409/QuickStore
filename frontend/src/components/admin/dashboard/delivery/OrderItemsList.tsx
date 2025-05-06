import React from "react";
import { OrderItemComponent } from "./OrderItem";

type OrderItem = {
  _id: string;
  product: {
    name: string;
    price: number;
  };
  quantity: number;
};

type OrderItemsListProps = {
  items: OrderItem[];
  total: number;
};

export const OrderItemsList: React.FC<OrderItemsListProps> = ({
  items,
  total,
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No items in this order
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <OrderItemComponent key={item._id} item={item} />
      ))}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">Subtotal</div>
          <div className="font-medium">${total.toFixed(2)}</div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="text-sm text-gray-500">Delivery Fee</div>
          <div className="font-medium">$0.00</div>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
          <div className="font-medium">Total</div>
          <div className="text-lg font-bold text-blue-600">
            ${total.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};
