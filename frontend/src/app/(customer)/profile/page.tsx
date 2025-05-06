"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { UserService } from "@/services/userService";
import { getAccessToken } from "@/utils/auth";
import { Product } from "@/store/slices/productsSlice";

// Redux actions and selectors
import {
  fetchUserProfile,
  updateUserProfile,
  fetchAddresses,
  fetchWallet,
  fetchWishlist,
  selectUser,
  selectAddresses,
  selectWallet,
  selectWishlist,
  selectUserStatus,
} from "@/store/slices/userSlice";
import {
  fetchCart,
  selectCartItems,
  selectCartTotal,
} from "@/store/slices/cartSlice";

// Component imports
import ProductCard from "@/components/common/ProductCard";

// Interfaces
interface Address {
  id?: string;
  _id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
  country: string;
}

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
}

interface WishlistItem {
  id: string;
  productId: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const ProfilePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Redux selectors
  const user = useSelector(selectUser);
  const addresses = useSelector(selectAddresses) as Address[];
  const wallet = useSelector(selectWallet);
  const wishlist = useSelector(selectWishlist) as WishlistItem[];
  const cartItems = useSelector(selectCartItems) as CartItem[];
  const cartTotal = useSelector(selectCartTotal);
  const userStatus = useSelector(selectUserStatus);

  // Local state
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    isDefault: false,
  });
  const [activeTab, setActiveTab] = useState("addresses"); // For mobile view tabs

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchUserProfile());
        await dispatch(fetchAddresses());
        await dispatch(fetchWallet());
        await dispatch(fetchWishlist());
        await dispatch(fetchCart());
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [dispatch]);

  // Update form data when user info changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
      });
    }
  }, [user]);

  // Handle delete address
  const handleDeleteAddress = async (addressId: string) => {
    try {
      if (!addressId) {
        return;
      }
      await UserService.deleteAddress(addressId);
      await dispatch(fetchAddresses());
    } catch (error) {
      console.error("Error deleting address:", error);
    }
  };

  // Handle edit address
  const handleEditAddress = (address: Address) => {
    const addressId = address._id || address.id;
    if (!addressId) {
      return;
    }
    setEditingAddressId(addressId);
    setAddressForm({
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
      zipCode: address.zipCode,
      isDefault: address.isDefault,
    });
    setIsAddingAddress(true);
  };

  // Handle address form input changes
  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setAddressForm({
      ...addressForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle submit address form
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        // Update existing address
        await UserService.updateAddress(editingAddressId, addressForm);
      } else {
        // Add new address
        await UserService.addAddress(addressForm);
      }
      setIsAddingAddress(false);
      setEditingAddressId(null);
      setAddressForm({
        street: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
        isDefault: false,
      });
      await dispatch(fetchAddresses());
    } catch (error) {
      console.error("Error saving address:", error);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(updateUserProfile(formData));
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Loading state
  if (userStatus === "loading") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="md:col-span-2 h-64 bg-gray-200 rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - no user
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">User Not Found</h3>
          <p>Please try logging in again to access your profile.</p>
          <button
            className="mt-4 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            onClick={() => (window.location.href = "/login")}
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>

      {/* Mobile tabs */}
      <div className="md:hidden mb-6 border-b border-gray-200">
        <div className="flex space-x-6">
          <button
            className={`pb-4 px-1 ${
              activeTab === "profile"
                ? "border-b-2 border-emerald-500 text-emerald-600 font-medium"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button
            className={`pb-4 px-1 ${
              activeTab === "addresses"
                ? "border-b-2 border-emerald-500 text-emerald-600 font-medium"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("addresses")}
          >
            Addresses
          </button>
          <button
            className={`pb-4 px-1 ${
              activeTab === "wallet"
                ? "border-b-2 border-emerald-500 text-emerald-600 font-medium"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("wallet")}
          >
            Wallet
          </button>
          <button
            className={`pb-4 px-1 ${
              activeTab === "wishlist"
                ? "border-b-2 border-emerald-500 text-emerald-600 font-medium"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("wishlist")}
          >
            Wishlist
          </button>
          <button
            className={`pb-4 px-1 ${
              activeTab === "cart"
                ? "border-b-2 border-emerald-500 text-emerald-600 font-medium"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("cart")}
          >
            Cart
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Information - Always visible on desktop, conditionally on mobile */}
        {(activeTab === "profile" || window.innerWidth >= 768) && (
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Profile
                  </h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Email cannot be changed
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Name
                      </h3>
                      <p className="mt-1 text-base text-gray-900">
                        {user.name}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Email
                      </h3>
                      <p className="mt-1 text-base text-gray-900">
                        {user.email}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Phone
                      </h3>
                      <p className="mt-1 text-base text-gray-900">
                        {user.phone || "Not provided"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Wallet - Visible in profile card on desktop */}
              <div className="hidden md:block px-6 py-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-500">
                    Wallet Balance
                  </h3>
                  <p className="text-lg font-semibold text-emerald-700">
                    ${(wallet?.balance || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content area - Right side on desktop */}
        <div className="md:col-span-2">
          {/* Addresses section */}
          {(activeTab === "addresses" || window.innerWidth >= 768) && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Delivery Addresses
                </h2>
                {!isAddingAddress && (
                  <button
                    onClick={() => {
                      setIsAddingAddress(true);
                      setEditingAddressId(null);
                      setAddressForm({
                        street: "",
                        city: "",
                        state: "",
                        country: "",
                        zipCode: "",
                        isDefault: false,
                      });
                    }}
                    className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Address
                  </button>
                )}
              </div>

              {isAddingAddress ? (
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        name="street"
                        value={addressForm.street}
                        onChange={handleAddressInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={addressForm.city}
                        onChange={handleAddressInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State/Province
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={addressForm.state}
                        onChange={handleAddressInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP/Postal Code
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={addressForm.zipCode}
                        onChange={handleAddressInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={addressForm.country}
                        onChange={handleAddressInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div className="flex items-center h-full pt-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="isDefault"
                          checked={addressForm.isDefault}
                          onChange={handleAddressInputChange}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Set as default address
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                    >
                      {editingAddressId ? "Update Address" : "Save Address"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingAddress(false);
                        setEditingAddressId(null);
                      }}
                      className="px-5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : addresses.length === 0 ? (
                <div className="text-center py-10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-base font-medium text-gray-900">
                    No saved addresses
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add your first delivery address to get started.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address: Address) => {
                    const addressId = address._id || address.id;
                    return (
                      <div
                        key={addressId}
                        className={`border rounded-xl p-4 relative ${
                          address.isDefault
                            ? "bg-emerald-50 border-emerald-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {address.isDefault && (
                          <span className="absolute top-4 right-4 text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-medium">
                            Default
                          </span>
                        )}
                        <div className="mb-3">
                          <p className="font-medium text-gray-900">
                            {address.street}
                          </p>
                          <p className="text-gray-600">
                            {address.city}, {address.state} {address.zipCode}
                          </p>
                          <p className="text-gray-600">{address.country}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditAddress(address)}
                            className="text-xs px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (addressId) {
                                handleDeleteAddress(addressId);
                              }
                            }}
                            className="text-xs px-3 py-1.5 border border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Wallet section - Only visible in tab view on mobile */}
          {(activeTab === "wallet" || window.innerWidth >= 768) && (
            <div className="md:hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Wallet
              </h2>
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white mb-6">
                <p className="text-sm font-medium opacity-80">
                  Current Balance
                </p>
                <p className="text-3xl font-bold mt-1">
                  ${(wallet?.balance || 0).toFixed(2)}
                </p>
              </div>

              <h3 className="font-medium text-gray-700 mb-3">
                Recent Transactions
              </h3>
              <div className="space-y-3">
                {wallet?.transactions?.length > 0 ? (
                  wallet.transactions.map((transaction: Transaction) => (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                      <p
                        className={
                          transaction.type === "credit"
                            ? "text-emerald-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {transaction.type === "credit" ? "+" : "-"}$
                        {transaction.amount.toFixed(2)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 py-3">No recent transactions.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
