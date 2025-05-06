import React from "react";

type OrderItemProps = {
  item: {
    _id: string;
    product: {
      name: string;
      price: number;
    };
    quantity: number;
  };
};

export const OrderItemComponent: React.FC<OrderItemProps> = ({ item }) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">
            {item.product.name}
          </h4>
          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">
          ${(item.product.price * item.quantity).toFixed(2)}
        </p>
        <p className="text-xs text-gray-500">
          ${item.product.price.toFixed(2)} each
        </p>
      </div>
    </div>
  );
};
