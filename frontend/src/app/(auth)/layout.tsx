"use client";

import React from "react";
import { ShoppingBag, Package, Clock, Star } from "lucide-react";

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel with branding and imagery - hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-emerald-500 to-emerald-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <ShoppingBag className="text-white" size={36} />
            <h1 className="text-4xl font-bold">QuickStore</h1>
          </div>
          
          <p className="text-xl mb-12 text-center max-w-md">
            The fastest way to get everything you need, delivered to your door in minutes
          </p>
          
          {/* Feature highlights */}
          <div className="w-full max-w-md space-y-6 mb-8">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Clock size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Fast Delivery</h3>
                <p className="text-white/80">Get your items in minutes, not days</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Thousands of Products</h3>
                <p className="text-white/80">Everything you need in one place</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Star size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Premium Quality</h3>
                <p className="text-white/80">Only the best products for our customers</p>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="relative w-3/4 h-48">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-2xl rotate-12 backdrop-blur-sm border border-white/20"></div>
            <div className="absolute bottom-8 right-12 w-48 h-48 bg-white/10 rounded-2xl -rotate-6 backdrop-blur-sm border border-white/20"></div>
            <div className="absolute top-16 right-0 w-24 h-24 bg-white/10 rounded-full backdrop-blur-sm border border-white/20"></div>
          </div>
        </div>
      </div>

      {/* Right panel with form content */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {/* Mobile logo - visible only on small screens */}
          <div className="md:hidden flex justify-center items-center space-x-2 mb-8">
            <ShoppingBag className="text-emerald-500" size={28} />
            <div className="text-2xl font-bold text-emerald-600">QuickStore</div>
          </div>

          {/* Form content goes here */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;