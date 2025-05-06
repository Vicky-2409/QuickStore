import React, { useState } from "react";
import Link from "next/link";

type User = {
  name: string;
  email: string;
  vehicleType: string;
  vehicleNumber: string;
};

type HeaderProps = {
  user: User;
  isConnected: boolean;
  onLogout: () => void;
};

export const Header: React.FC<HeaderProps> = ({ user, isConnected, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm backdrop-blur-sm bg-opacity-90 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-blue-600 mr-2">
              <path
                fill="currentColor"
                d="M19.15,8c.36,0,.72-.1,1.06-.3l1.55-1.09a1.5,1.5,0,0,0-1.71-2.47L18.5,5.23A1.5,1.5,0,0,0,19.15,8Z"
              />
              <path
                fill="currentColor"
                d="M22,10H19.23a3.69,3.69,0,0,0-6.53.06h0A1.5,1.5,0,0,0,10.5,12h-5a1.5,1.5,0,0,0-1.5,1.5v3A1.5,1.5,0,0,0,5.5,18h11A1.5,1.5,0,0,0,18,16.5V13h4a1,1,0,0,0,1-1A2,2,0,0,0,22,10Zm-6,3H5.5v-1h10.5Z"
              />
              <circle fill="currentColor" cx="16" cy="10" r="2" />
              <circle fill="currentColor" cx="6" cy="19" r="2" />
              <circle fill="currentColor" cx="16" cy="19" r="2" />
            </svg>
            <h1 className="text-xl font-semibold text-gray-800">DeliverDash</h1>
            {!isConnected && (
              <span className="ml-4 text-red-500 text-sm px-2 py-1 rounded-full bg-red-50 border border-red-100">
                Offline
              </span>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-lg">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-500">
                <path
                  fill="currentColor"
                  d="M18 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5m1.5-9H17V12h4.46L19.5 9.5M6 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5M20 8l3 4v5h-2c0 1.66-1.34 3-3 3s-3-1.34-3-3H9c0 1.66-1.34 3-3 3s-3-1.34-3-3H1V6c0-1.11.89-2 2-2h14v4h3M3 6v9h.76c.55-.61 1.35-1 2.24-1 .89 0 1.69.39 2.24 1H15V6H3m7 1l3.5 3.5L10 14v-2.5H5v-2h5V7Z"
                />
              </svg>
              <span className="font-medium">{user.vehicleType}</span>
              <span className="text-gray-400">|</span>
              <span>{user.vehicleNumber}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/delivery-partner/completed-orders"
                className="text-gray-600 hover:text-blue-600 transition-colors flex items-center"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 mr-1">
                  <path
                    fill="currentColor"
                    d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
                  />
                </svg>
                Completed Orders
              </Link>
              <Link
                href="/delivery-partner/profile"
                className="text-gray-600 hover:text-blue-600 transition-colors flex items-center"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 mr-1">
                  <path
                    fill="currentColor"
                    d="M12 4a4 4 0 014 4 4 4 0 01-4 4 4 4 0 01-4-4 4 4 0 014-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z"
                  />
                </svg>
                Profile
              </Link>
            </div>
            <div className="text-sm flex items-center">
              <span className="mr-2 font-medium text-gray-700">{user.name}</span>
              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="text-gray-700 px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors flex items-center"
            >
              <span>Logout</span>
              <svg viewBox="0 0 24 24" className="ml-2 h-4 w-4">
                <path
                  fill="currentColor"
                  d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white pt-2 pb-3 border-t border-gray-100">
          <div className="px-4 space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-500">
                <path
                  fill="currentColor"
                  d="M18 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5m1.5-9H17V12h4.46L19.5 9.5M6 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5M20 8l3 4v5h-2c0 1.66-1.34 3-3 3s-3-1.34-3-3H9c0 1.66-1.34 3-3 3s-3-1.34-3-3H1V6c0-1.11.89-2 2-2h14v4h3M3 6v9h.76c.55-.61 1.35-1 2.24-1 .89 0 1.69.39 2.24 1H15V6H3m7 1l3.5 3.5L10 14v-2.5H5v-2h5V7Z"
                />
              </svg>
              <span className="font-medium">{user.vehicleType}</span>
              <span className="text-gray-400">|</span>
              <span>{user.vehicleNumber}</span>
            </div>
            <div className="flex flex-col space-y-2">
              <Link
                href="/delivery-partner/completed-orders"
                className="text-gray-600 hover:text-blue-600 transition-colors flex items-center px-3 py-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                  <path
                    fill="currentColor"
                    d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
                  />
                </svg>
                Completed Orders
              </Link>
              <Link
                href="/delivery-partner/profile"
                className="text-gray-600 hover:text-blue-600 transition-colors flex items-center px-3 py-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                  <path
                    fill="currentColor"
                    d="M12 4a4 4 0 014 4 4 4 0 01-4 4 4 4 0 01-4-4 4 4 0 014-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z"
                  />
                </svg>
                Profile
              </Link>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-gray-700">{user.name}</span>
            </div>
            <div>
              <button
                onClick={onLogout}
                className="w-full text-gray-700 px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <span>Logout</span>
                <svg viewBox="0 0 24 24" className="ml-2 h-4 w-4">
                  <path
                    fill="currentColor"
                    d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
