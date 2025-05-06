"use client";

import React from "react";
import AdminRoute from "@/components/auth/AdminRoute";

export default function AdminPage() {
  return (
    <AdminRoute>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        {/* Add your dashboard content here */}
      </div>
    </AdminRoute>
  );
}
