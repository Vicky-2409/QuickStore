"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import CategoryForm from "@/components/admin/CategoryForm";
import { productService } from "@/services/productService";

interface Category {
  id: string;
  name: string;
  description: string;
  active: boolean;
  image?: string;
}

type Props = {
  params: Promise<{ id: string }>;
};

export default function EditCategoryPage({ params }: Props) {
  const { id: categoryId } = React.use(params);
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategory();
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      const response = await productService.getCategory(categoryId);
      // Extract the actual category data from the response
      const categoryData = response.data;
      setCategory(categoryData);
    } catch (error) {
      console.error("Error fetching category:", error);
      toast.error("Failed to fetch category");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      const data = new FormData();

      // Add all form fields to FormData
      data.append("name", formData.get("name"));
      data.append("description", formData.get("description"));
      data.append("active", formData.get("active"));

      // Handle image upload
      const image = formData.get("image");
      if (image && image.size > 0) {
        data.append("image", image);
      }

      await productService.updateCategory(categoryId, data);
      toast.success("Category updated successfully");
      router.push("/admin/categories");
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-4"></div>
          <p className="text-gray-600">Loading category data...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-gray-400 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Category not found
        </h2>
        <p className="text-gray-600 mb-6">
          The category you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => router.push("/admin/categories")}
          className="inline-flex items-center px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
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
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Edit Category</h1>
          <p className="text-gray-600 mt-2">
            Update information for "{category.name}"
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
        initialData={category}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
