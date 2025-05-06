"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import CategoryForm from "@/components/admin/CategoryForm";
import { adminService } from "@/services/admin.service";

const initialCategoryData = {
  name: "",
  description: "",
  active: true,
  image: "",
};

export default function CreateCategoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      const imageFile = formData.get("image");
      if (imageFile && imageFile.size > 0) {
        // Validate image file
        if (imageFile.size > 5 * 1024 * 1024) {
          toast.error("Image size should be less than 5MB");
          return;
        }
        if (
          !["image/jpeg", "image/jpg", "image/png"].includes(imageFile.type)
        ) {
          toast.error("Only JPG, JPEG, and PNG images are allowed");
          return;
        }
      }

      await adminService.createCategory(formData);
      toast.success("Category created successfully");
      router.push("/admin/categories");
      router.refresh();
    } catch (error) {
      toast.error("Failed to create category");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Create Category</h1>
          <p className="text-gray-600 mt-2">
            Add a new product category to your store
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/categories")}
          className="flex items-center text-gray-600 hover:text-emerald-600 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Categories
        </button>
      </div>
      <CategoryForm
        initialData={initialCategoryData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
