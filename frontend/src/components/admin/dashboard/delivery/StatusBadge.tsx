import React from "react";

type StatusBadgeProps = {
  status: string;
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusColor = (status: string) => {
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
    <span
      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
        status
      )} border inline-flex items-center`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1"></span>
      {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
    </span>
  );
};
