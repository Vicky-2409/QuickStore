"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  selectCartItems,
  selectCartTotal,
  selectCartStatus,
  selectCartError,
  fetchCart,
  removeFromCart,
  updateCartItem,
} from "@/store/slices/cartSlice";
import Link from "next/link";
import { isAuthenticated } from "@/utils/auth";
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus } from "lucide-react";
import { message } from "antd";
import { AppDispatch } from "@/store/store";

export default function CartPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const status = useSelector(selectCartStatus);
  const error = useSelector(selectCartError);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    const handleFetchCart = async () => {
      // Dispatch the async thunk action
      await dispatch(fetchCart()); // Make sure the dispatch function is correctly typed
    };
    handleFetchCart();
  }, [dispatch, router]);

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity > 0) {
      try {
        // Update the cart
        await dispatch(
          updateCartItem({ productId, quantity: newQuantity })
        ).unwrap();

        // Update local state immediately
        const updatedItems = items.map((item) =>
          item.product._id === productId
            ? { ...item, quantity: newQuantity }
            : item
        );

        // Calculate new total
        const newTotal = updatedItems.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );

        // Update state
        dispatch({
          type: "cart/updateCartItem/fulfilled",
          payload: {
            data: {
              cart: updatedItems,
              total: newTotal,
            },
          },
        });

        message.success("Cart updated successfully");
      } catch (error) {
        message.error("Failed to update cart");
        // Revert to previous state
        dispatch(fetchCart());
      }
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      // Remove the item
      await dispatch(removeFromCart(productId)).unwrap();

      // Update local state immediately
      const updatedItems = items.filter(
        (item) => item.product._id !== productId
      );
      const newTotal = updatedItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );

      // Update state
      dispatch({
        type: "cart/removeFromCart/fulfilled",
        payload: {
          data: {
            cart: updatedItems,
            total: newTotal,
          },
        },
      });

      message.success("Item removed from cart");
    } catch (error) {
      message.error("Failed to remove item from cart");
      // Revert to previous state
      dispatch(fetchCart());
    }
  };

  if (status === "loading") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-100 rounded w-1/4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded shadow-sm"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm">
          <p className="font-medium">Error: {error}</p>
          <button
            className="mt-4 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
            onClick={() => dispatch(fetchCart())}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center space-x-3 mb-10">
        <ShoppingBag className="w-7 h-7 text-emerald-500" />
        <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl shadow-sm">
          <div className="flex justify-center mb-4">
            <ShoppingBag className="w-16 h-16 text-gray-300" />
          </div>
          <p className="text-gray-500 text-lg mb-6">Your cart is empty</p>
          <Link href="/shop">
            <button className="px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors shadow-sm">
              Continue Shopping
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            <div className="hidden md:flex justify-between items-center pb-4 border-b border-gray-200 text-sm text-gray-500 font-medium">
              <span className="w-1/2">Product</span>
              <span className="w-1/6 text-center">Price</span>
              <span className="w-1/6 text-center">Quantity</span>
              <span className="w-1/6 text-center">Total</span>
              <span className="w-12"></span>
            </div>

            {items.map((item) => (
              <div
                key={item.product._id}
                className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-100 hover:border-emerald-100 transition-colors"
              >
                {/* Mobile view */}
                <div className="md:hidden space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {item.product.name}
                        </h3>
                        <p className="text-emerald-500 font-medium">
                          ${item.product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.product._id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item.product._id,
                            item.quantity - 1
                          )
                        }
                        className="px-3 py-1 text-gray-500 hover:text-emerald-500 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-3 py-1 font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item.product._id,
                            item.quantity + 1
                          )
                        }
                        className="px-3 py-1 text-gray-500 hover:text-emerald-500 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="font-medium text-gray-900">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Desktop view */}
                <div className="hidden md:flex items-center">
                  <div className="w-1/2 flex items-center space-x-4">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <h3 className="font-medium text-gray-900">
                      {item.product.name}
                    </h3>
                  </div>
                  <div className="w-1/6 text-center">
                    <p className="text-emerald-500 font-medium">
                      ${item.product.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-1/6 flex justify-center">
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item.product._id,
                            item.quantity - 1
                          )
                        }
                        className="px-2 py-1 text-gray-500 hover:text-emerald-500 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-3 py-1 font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item.product._id,
                            item.quantity + 1
                          )
                        }
                        className="px-2 py-1 text-gray-500 hover:text-emerald-500 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="w-1/6 text-center font-medium text-gray-900">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </div>
                  <div className="w-12 flex justify-end">
                    <button
                      onClick={() => handleRemoveItem(item.product._id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden sticky top-8">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">
                  Order Summary
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-gray-100 pt-4 mt-4"></div>
                <div className="flex justify-between text-lg font-semibold text-gray-900">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <Link href="/checkout">
                  <button className="w-full py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors shadow-sm flex items-center justify-center space-x-2 mt-6">
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <Link href="/shop">
                  <button className="w-full py-3 bg-white text-emerald-500 border border-emerald-500 font-medium rounded-lg hover:bg-emerald-50 transition-colors mt-3">
                    Continue Shopping
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
