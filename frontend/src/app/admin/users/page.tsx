"use client";

import React, { useEffect, useState } from "react";
import { User } from "@/types/user";
import { authService } from "@/services/auth.service";
import { toast } from "react-hot-toast";
import AdminRoute from "@/components/admin/AdminRoute";

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await authService.getAllUsers();
      console.log("data", data);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error fetching users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await authService.toggleUserStatus(id, !currentStatus);
      toast.success(
        `User ${currentStatus ? "blocked" : "unblocked"} successfully`
      );
      fetchUsers();
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Error updating user status");
    }
  };

  const filteredUsers = users.filter((user) => {
    // Filter by search query
    const matchesSearch =
      searchQuery.trim() === "" ||
      `${user.name}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone && user.phone.includes(searchQuery));

    // Filter by role
    const matchesRole =
      selectedRole === "all" ||
      user.role.toLowerCase() === selectedRole.toLowerCase();

    // Filter by status
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && user.active) ||
      (selectedStatus === "blocked" && !user.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleOptions = [
    "all",
    ...new Set(users.map((user) => user.role.toLowerCase())),
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-emerald-500 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-emerald-600 font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminRoute>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage all users in your platform
            </p>
          </header>

          {/* Filters and Search */}
          <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Search Users
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Name, email or phone"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Filter by Role
                </label>
                <select
                  id="role"
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role === "all"
                        ? "All Roles"
                        : role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Filter by Status
                </label>
                <select
                  id="status"
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
          </div>

          {/* User count and stats */}
          <div className="mb-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {filteredUsers.length} of {users.length} users
            </div>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>
                <span className="text-sm text-gray-600">
                  {users.filter((user) => user.active).length} Active
                </span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                <span className="text-sm text-gray-600">
                  {users.filter((user) => !user.active).length} Blocked
                </span>
              </div>
            </div>
          </div>

          {/* Users Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl shadow-sm p-10 text-center">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No users found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery ||
                  selectedRole !== "all" ||
                  selectedStatus !== "all"
                    ? "Try adjusting your search filters"
                    : "No users have been registered yet"}
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
                >
                  <div
                    className={`h-2 ${
                      user.active ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  ></div>
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-lg font-medium text-gray-700">
                              {user.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">{`${user.name}`}</h2>
                          <div className="flex items-center mt-1">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role.toLowerCase() === "admin"
                                  ? "bg-purple-100 text-purple-800"
                                  : user.role.toLowerCase() === "partner"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {user.role.charAt(0).toUpperCase() +
                                user.role.slice(1)}
                            </span>
                            <span
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.active
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {user.active ? "Active" : "Blocked"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-start">
                        <svg
                          className="w-5 h-5 text-gray-400 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-gray-600">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-start">
                          <svg
                            className="w-5 h-5 text-gray-400 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span className="text-gray-600">{user.phone}</span>
                        </div>
                      )}
                      {user.vehicleType && (
                        <div className="flex items-start">
                          <svg
                            className="w-5 h-5 text-gray-400 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                            />
                          </svg>
                          <span className="text-gray-600">
                            {user.vehicleType} ({user.vehicleNumber})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      <button
                        onClick={() =>
                          handleToggleStatus(user._id, user.active)
                        }
                        className={`w-full px-4 py-2 rounded-md text-white font-medium transition-colors duration-200 ${
                          user.active
                            ? "bg-red-500 hover:bg-red-600 focus:ring-red-200"
                            : "bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-200"
                        } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                      >
                        {user.active ? "Block User" : "Activate User"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminRoute>
  );
};

export default UsersPage;
