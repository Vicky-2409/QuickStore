import React from "react";

type OrderProgressBarProps = {
  status: string;
};

export const OrderProgressBar: React.FC<OrderProgressBarProps> = ({
  status,
}) => {
  const steps = [
    { id: "pending", label: "Pending" },
    { id: "assigned", label: "Assigned" },
    { id: "picked_up", label: "Picked Up" },
    { id: "delivered", label: "Delivered" },
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex((step) => step.id === status);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="relative">
      {/* Progress Bar */}
      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
          style={{
            width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
          }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isCompleted
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                    : "bg-gray-100 text-gray-400"
                } ${isCurrent ? "ring-4 ring-blue-100" : ""}`}
              >
                {isCompleted ? (
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path
                      fill="currentColor"
                      d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
                    />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  isCompleted ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
