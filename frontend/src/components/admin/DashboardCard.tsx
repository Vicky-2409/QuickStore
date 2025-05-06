import React from "react";
import { FaBox, FaTruck, FaUser, FaUsers, FaCheckCircle } from "react-icons/fa";

interface DashboardCardProps {
  title: string;
  count: number;
  icon?: "orders" | "delivery" | "users" | "partners" | "delivered";
  color?: string;
}

const iconMap = {
  orders: FaBox,
  delivery: FaTruck,
  users: FaUser,
  partners: FaUsers,
  delivered: FaCheckCircle,
};

export default function DashboardCard({
  title,
  count,
  icon = "orders",
  color = "blue",
}: DashboardCardProps) {
  const Icon = iconMap[icon];

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-${color}-500`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{count}</p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-500`} />
        </div>
      </div>
    </div>
  );
}
