import React from "react";

type Customer = {
  name: string;
  email: string;
  phone: string;
};

type Address = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
};

type CustomerDetailsProps = {
  customer: Customer;
  address: Address;
};

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({
  customer,
  address,
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="space-y-4">
        {/* Customer Name */}
        <div className="flex items-start">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400 mt-0.5">
            <path
              fill="currentColor"
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
            />
          </svg>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{customer.name}</p>
            <p className="text-sm text-gray-500">Customer</p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="flex items-start">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400 mt-0.5">
            <path
              fill="currentColor"
              d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
            />
          </svg>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {customer.email}
            </p>
            <p className="text-sm text-gray-500">Email</p>
          </div>
        </div>

        <div className="flex items-start">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400 mt-0.5">
            <path
              fill="currentColor"
              d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
            />
          </svg>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {customer.phone}
            </p>
            <p className="text-sm text-gray-500">Phone</p>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="flex items-start">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400 mt-0.5">
            <path
              fill="currentColor"
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
            />
          </svg>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              Delivery Address
            </p>
            <p className="text-sm text-gray-500">
              {address.street}, {address.city}, {address.state}{" "}
              {address.zipCode}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
