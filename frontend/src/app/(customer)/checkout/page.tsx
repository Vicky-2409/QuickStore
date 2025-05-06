"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  selectCartItems,
  selectCartTotal,
  selectCartStatus,
} from "@/store/slices/cartSlice";
import {
  selectAddresses,
  fetchAddresses,
  selectUser,
  fetchUserProfile,
} from "@/store/slices/userSlice";
import { message } from "antd";
import { Form } from "antd";
import { isAuthenticated } from "@/utils/auth";
import { loadScript } from "@/utils/razorpay";
import { UserService } from "@/services/userService";
import { orderService } from "@/services/order.service";
import { paymentService } from "@/services/payment.service";
import { cartService } from "@/services/cartService";
import { toast } from "react-hot-toast";
import { MapPin, ShoppingBag, CreditCard, Package, Check, ChevronLeft, ChevronRight, Plus } from "lucide-react";

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

interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
  quantity: number;
}

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const status = useSelector(selectCartStatus);
  const addresses = useSelector(selectAddresses) as Address[];
  const user = useSelector(selectUser);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        message.error("Please login to continue");
        router.push("/login");
        return;
      }

      try {
        // Load user data and addresses
        await dispatch(fetchUserProfile() as any);
        await dispatch(fetchAddresses() as any);
        loadScript("https://checkout.razorpay.com/v1/checkout.js");
      } catch (error) {
        console.error("Error loading user data:", error);
        message.error("Failed to load user data. Please try again.");
      }
    };

    checkAuth();
  }, [router, dispatch]);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddress =
        addresses.find((addr) => addr.isDefault) || addresses[0];
      setSelectedAddress(defaultAddress);
    }
  }, [addresses, selectedAddress]);

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
  };

  const handleSubmitAddress = async (values: any) => {
    try {
      await UserService.addAddress(values);
      setIsAddingAddress(false);
      addressForm.resetFields();
      await dispatch(fetchAddresses() as any);
      message.success("Address added successfully");
    } catch (error) {
      message.error("Failed to add address");
      console.error("Error adding address:", error);
    }
  };

  const handlePayment = async () => {
    if (!isAuthenticated()) {
      message.error("Please login to continue");
      router.push("/login");
      return;
    }

    if (!user?.email) {
      message.error("User data not loaded. Please refresh the page.");
      return;
    }

    if (!selectedAddress) {
      message.error("Please select a shipping address");
      return;
    }

    try {
      setLoading(true);
      console.log("Starting payment process...");

      // Create order first
      console.log("Creating order with items:", items);
      const order = await orderService.createOrder({
        items: items.map((item: CartItem) => ({
          product: {
            _id: item.product._id,
            name: item.product.name,
            price: item.product.price,
            imageUrl: item.product.imageUrl,
          },
          quantity: item.quantity,
        })),
        total,
        address: {
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.zipCode,
          country: selectedAddress.country,
        },
      });
      console.log("Order created:", order);

      // Create payment with order ID
      console.log("Creating payment for order:", order._id);
      const payment = await paymentService.createPayment(
        total,
        order._id,
        user.email, // Get email from Redux store
        {
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.zipCode,
          country: selectedAddress.country,
        }
      );
      console.log("Payment created:", payment);

      // Initialize Razorpay
      console.log("Initializing Razorpay with options:", {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: payment.amount,
        currency: "INR",
        name: "Your Store Name",
        description: "Order Payment",
        order_id: payment.razorpayOrderId,
      });
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: payment.amount,
        currency: "INR",
        name: "Your Store Name",
        description: "Order Payment",
        order_id: payment.razorpayOrderId,
        handler: async (response: any) => {
          try {
            console.log("Razorpay payment response:", response);
            // Verify payment with order ID
            console.log("Verifying payment with Razorpay...");
            await paymentService.verifyPayment(
              order._id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              payment.razorpayOrderId
            );

            // Clear cart and redirect
            console.log("Payment verified successfully, clearing cart...");
            cartService.clearCart();
            router.push("/orders");
          } catch (error: any) {
            console.error("Payment verification failed:", error);
            if (error.response?.status === 401) {
              message.error("Session expired. Please login again.");
              router.push("/login");
            } else {
              toast.error("Payment verification failed");
            }
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#10b981",
        },
        modal: {
          ondismiss: function () {
            console.log("Payment window closed");
          },
        },
        notes: {
          orderId: order._id,
        },
        callback_url: `${window.location.origin}/api/payments/verify`,
      };

      const razorpay = new (window as any).Razorpay(options);
      console.log("Opening Razorpay payment window...");
      razorpay.open();
    } catch (error: any) {
      console.error("Payment process failed:", error);
      if (error.response?.status === 401) {
        message.error("Session expired. Please login again.");
        router.push("/login");
      } else {
        toast.error("Failed to process payment");
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-100 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-100 rounded-lg"></div>
            <div className="h-96 bg-gray-100 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => router.push('/cart')}
              className="text-gray-500 hover:text-emerald-500 transition-colors flex items-center space-x-1"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back to Cart</span>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-6 w-6 text-emerald-500" />
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
          </div>
        </div>
        
        {/* Checkout Steps */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-2xl">
            <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200"></div>
            <div className="flex justify-between relative">
              <div className="flex flex-col items-center">
                <div className="rounded-full h-10 w-10 flex items-center justify-center bg-emerald-500 text-white z-10">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium mt-2">Cart</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="rounded-full h-10 w-10 flex items-center justify-center bg-emerald-500 text-white z-10">
                  <MapPin className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium mt-2">Address</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="rounded-full h-10 w-10 flex items-center justify-center bg-emerald-500 text-white z-10">
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium mt-2">Payment</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="rounded-full h-10 w-10 flex items-center justify-center bg-gray-200 text-gray-500 z-10">
                  <Package className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium mt-2">Order Complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Side - Addresses */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-emerald-500" />
                <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
              </div>
              {!isAddingAddress && (
                <button
                  onClick={() => setIsAddingAddress(true)}
                  className="text-sm text-emerald-500 hover:text-emerald-600 font-medium flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add New
                </button>
              )}
            </div>
            <div className="p-6">
              {isAddingAddress ? (
                <Form
                  form={addressForm}
                  onFinish={handleSubmitAddress}
                  layout="vertical"
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item
                      name="street"
                      label="Street Address"
                      rules={[
                        {
                          required: true,
                          message: "Please enter street address",
                        },
                      ]}
                    >
                      <input 
                        placeholder="Enter street address" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                      />
                    </Form.Item>
                    <Form.Item
                      name="city"
                      label="City"
                      rules={[{ required: true, message: "Please enter city" }]}
                    >
                      <input 
                        placeholder="Enter city" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                      />
                    </Form.Item>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item
                      name="state"
                      label="State"
                      rules={[{ required: true, message: "Please enter state" }]}
                    >
                      <input 
                        placeholder="Enter state" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                      />
                    </Form.Item>
                    <Form.Item
                      name="zipCode"
                      label="ZIP Code"
                      rules={[
                        { required: true, message: "Please enter ZIP code" },
                      ]}
                    >
                      <input 
                        placeholder="Enter ZIP code" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                      />
                    </Form.Item>
                  </div>
                  <Form.Item
                    name="country"
                    label="Country"
                    rules={[
                      { required: true, message: "Please enter country" },
                    ]}
                  >
                    <input 
                      placeholder="Enter country" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                    />
                  </Form.Item>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors shadow-sm"
                    >
                      Save Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </Form>
              ) : (
                <div className="space-y-4">
                  {addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No addresses found</p>
                      <button
                        onClick={() => setIsAddingAddress(true)}
                        className="mt-4 px-4 py-2 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors shadow-sm flex items-center mx-auto"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Address
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {addresses.map((address) => (
                        <div
                          key={address._id || address.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                            selectedAddress?._id === address._id ||
                            selectedAddress?.id === address.id
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-gray-200 hover:border-emerald-200"
                          }`}
                          onClick={() => handleAddressSelect(address)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex space-x-2 items-center">
                              <MapPin className={`h-4 w-4 ${
                                  selectedAddress?._id === address._id ||
                                  selectedAddress?.id === address.id
                                    ? "text-emerald-500"
                                    : "text-gray-400"
                                }`} 
                              />
                              <p className="font-medium text-gray-900">{address.street}</p>
                            </div>
                            {(selectedAddress?._id === address._id || selectedAddress?.id === address.id) && (
                              <div className="bg-emerald-500 text-white p-1 rounded-full">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                          <div className="pl-6 text-gray-600 text-sm space-y-1">
                            <p>
                              {address.city}, {address.state} {address.zipCode}
                            </p>
                            <p>{address.country}</p>
                          </div>
                          {address.isDefault && (
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full inline-block mt-2 ml-6">
                              Default
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden sticky top-8">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center space-x-2">
              <ShoppingBag className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {items.map((item: any) => (
                    <div key={item.product._id} className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        {item.product.imageUrl && (
                          <div className="w-12 h-12 rounded-md border border-gray-200 overflow-hidden">
                            <img 
                              src={item.product.imageUrl} 
                              alt={item.product.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{item.product.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-medium text-gray-900">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Pricing */}
                <div className="space-y-2 py-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>
                
                {/* Total */}
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Pay Button */}
                <button
                  className={`w-full py-3 font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-2 mt-6
                    ${loading || !selectedAddress || items.length === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                    }`}
                  onClick={handlePayment}
                  disabled={loading || !selectedAddress || items.length === 0}
                >
                  <CreditCard className="h-5 w-5" />
                  <span>{loading ? "Processing..." : "Pay Now"}</span>
                </button>
                
                {/* Warning States */}
                {!selectedAddress && (
                  <p className="text-sm text-amber-600 flex items-center justify-center mt-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    Please select a shipping address
                  </p>
                )}
                {items.length === 0 && (
                  <p className="text-sm text-amber-600 flex items-center justify-center mt-2">
                    <ShoppingBag className="h-4 w-4 mr-1" />
                    Your cart is empty
                  </p>
                )}
                
                {/* Security Notice */}
                <div className="text-xs text-gray-500 mt-4 flex items-center justify-center">
                  <CreditCard className="h-3 w-3 mr-1" />
                  <span>Secure checkout powered by Razorpay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}