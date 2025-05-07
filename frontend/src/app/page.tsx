"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleLoginTypeSelect = (type) => {
    switch (type) {
      case "customer":
        router.push("/login");
        break;
      case "admin":
        router.push("/admin/login");
        break;
      case "delivery":
        router.push("/delivery-partner/login");
        break;
    }
  };

  // Card data for each user typ
  const userTypes = [
    {
      type: "customer",
      title: "Customer",
      description:
        "Order your favorite food and get it delivered to your doorstep",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3h18v18H3zM12 8v8M8 12h8" />
        </svg>
      ),
    },
    {
      type: "admin",
      title: "Admin",
      description: "Manage restaurants, orders, and delivery partners",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      ),
    },
    {
      type: "delivery",
      title: "Delivery Partner",
      description: "Deliver orders and earn money",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <circle cx="12" cy="14" r="4"></circle>
          <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
        </svg>
      ),
    },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-6xl px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-400">
            QuickStore
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The fastest way to get delicious food delivered to your doorstep
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {userTypes.map((user) => (
            <div
              key={user.type}
              className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${
                hoveredCard === user.type ? "scale-105 shadow-2xl" : "shadow-lg"
              }`}
              onMouseEnter={() => setHoveredCard(user.type)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleLoginTypeSelect(user.type)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-95"></div>

              <div className="relative p-8 flex flex-col items-center h-full">
                <div
                  className={`p-4 rounded-full mb-6 transition-all duration-300 ${
                    hoveredCard === user.type
                      ? "bg-emerald-500 text-white"
                      : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  {user.icon}
                </div>

                <h2 className="text-2xl font-bold mb-4 text-white">
                  {user.title}
                </h2>

                <p className="text-gray-300 text-center mb-8">
                  {user.description}
                </p>

                <div className="mt-auto w-full">
                  <button
                    className={`w-full py-3 rounded-lg font-medium transition-all duration-300 ${
                      hoveredCard === user.type
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-emerald-600"
                    }`}
                  >
                    {hoveredCard === user.type
                      ? "Continue →"
                      : `Login as ${user.title}`}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="w-full max-w-6xl px-6 py-4 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
          <p>© 2025 QuickStore</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-emerald-500 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-emerald-500 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-emerald-500 transition-colors">
              Contact Us
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
