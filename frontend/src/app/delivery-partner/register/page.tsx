"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@/enums/user.enum";
import { authService } from "@/services/auth.service";

// Vehicle Type enum
enum VehicleType {
  BIKE = "BIKE",
  CAR = "CAR",
  VAN = "VAN",
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  submit?: string;
}

export default function DeliveryPartnerRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    vehicleType: VehicleType.BIKE,
    vehicleNumber: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleVehicleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as VehicleType;
    setFormData((prev) => ({ ...prev, vehicleType: value }));
    setErrors((prev) => ({ ...prev, vehicleType: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    if (!formData.name) {
      setErrors((prev) => ({ ...prev, name: "Name is required" }));
      return;
    }
    if (!formData.email) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      return;
    }
    if (!formData.phone) {
      setErrors((prev) => ({ ...prev, phone: "Phone number is required" }));
      return;
    }
    if (!formData.password) {
      setErrors((prev) => ({ ...prev, password: "Password is required" }));
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
      return;
    }
    if (!formData.vehicleType) {
      setErrors((prev) => ({
        ...prev,
        vehicleType: "Vehicle type is required",
      }));
      return;
    }
    if (!formData.vehicleNumber) {
      setErrors((prev) => ({
        ...prev,
        vehicleNumber: "Vehicle number is required",
      }));
      return;
    }

    setIsLoading(true);
    try {
      await authService.registerDeliveryPartner({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: UserRole.DELIVERY_PARTNER,
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber,
      });
      router.push(
        `/delivery-partner/verify-otp?email=${encodeURIComponent(
          formData.email
        )}`
      );
    } catch (error: any) {
      console.error("Registration error:", error);
      setErrors((prev) => ({
        ...prev,
        submit:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header with background */}
        <div className="bg-emerald-500 py-6 px-8 text-white">
          <h2 className="text-3xl font-bold">Join Our Delivery Team</h2>
          <p className="mt-2 text-emerald-50">
            Fast deliveries, flexible hours, great earnings
          </p>
        </div>

        <div className="p-8">
          <p className="text-sm text-gray-600 mb-6">
            Already have an account?{" "}
            <Link
              href="/delivery-partner/login"
              className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
            >
              Login here
            </Link>
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {errors.submit && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                <p>{errors.submit}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`w-full px-4 py-3 bg-gray-50 border ${
                    errors.name ? "border-red-500" : "border-gray-200"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-3 bg-gray-50 border ${
                    errors.email ? "border-red-500" : "border-gray-200"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="md:col-span-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className={`w-full px-4 py-3 bg-gray-50 border ${
                    errors.phone ? "border-red-500" : "border-gray-200"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* Vehicle Type */}
              <div>
                <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type
                </label>
                <select
                  id="vehicleType"
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleVehicleTypeChange}
                  className={`w-full px-4 py-3 bg-gray-50 border ${
                    errors.vehicleType ? "border-red-500" : "border-gray-200"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                    paddingRight: "2.5rem"
                  }}
                >
                  <option value={VehicleType.BIKE}>Bike</option>
                  <option value={VehicleType.CAR}>Car</option>
                  <option value={VehicleType.VAN}>Van</option>
                </select>
                {errors.vehicleType && (
                  <p className="mt-1 text-sm text-red-600">{errors.vehicleType}</p>
                )}
              </div>

              {/* Vehicle Number */}
              <div>
                <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Number
                </label>
                <input
                  id="vehicleNumber"
                  name="vehicleNumber"
                  type="text"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  placeholder="TN01AB1234"
                  className={`w-full px-4 py-3 bg-gray-50 border ${
                    errors.vehicleNumber ? "border-red-500" : "border-gray-200"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                />
                {errors.vehicleNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.vehicleNumber}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 bg-gray-50 border ${
                    errors.password ? "border-red-500" : "border-gray-200"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                  autoComplete="new-password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 bg-gray-50 border ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-200"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 flex justify-center items-center bg-emerald-500 hover:bg-emerald-600 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <p className="text-xs text-gray-500 text-center">
              By creating an account, you agree to our 
              <a href="/terms" className="text-emerald-600 hover:text-emerald-500"> Terms of Service </a> 
              and 
              <a href="/privacy" className="text-emerald-600 hover:text-emerald-500"> Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}