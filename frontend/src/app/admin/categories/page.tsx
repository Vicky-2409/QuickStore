"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Category } from "@/types/category";
import { productService } from "@/services/productService";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils";
import Image from "next/image";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

// Custom Button component with emerald theme
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "default",
      size = "default",
      onClick,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const variants = {
      default:
        "bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 shadow-sm",
      destructive:
        "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm",
      outline:
        "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-emerald-500 hover:text-emerald-600",
      ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
    };

    const sizes = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-8 px-3 py-1 text-xs",
      lg: "h-12 px-6 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// Assuming the Category type is extended to include an image field
// Update your Category type in @/types/category.ts to include:
// image?: string;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isAuthenticated, user, isInitialized } = useAuth();

  // Memoize the admin check
  const isAdmin = useMemo(() => user?.role === "admin", [user?.role]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await productService.getCategories();
      setCategories(response.data || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      if (error.response?.status === 401) {
        router.push("/admin/login");
        return;
      }
      toast.error("Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Wait for auth state to be initialized
    if (!isInitialized) {
      return;
    }

    // Check authentication status
    if (!isAuthenticated || !isAdmin) {
      router.push("/admin/login");
      return;
    }

    // Only fetch categories if authenticated and initialized
    fetchCategories();
  }, [isInitialized, isAuthenticated, isAdmin, router, fetchCategories]);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await productService.toggleCategoryStatus(id, !currentStatus);
      toast.success(
        `Category ${currentStatus ? "unlisted" : "listed"} successfully`
      );
      fetchCategories();
    } catch (error: any) {
      console.error("Error toggling category status:", error);
      if (error.response?.status === 401) {
        router.push("/admin/login");
        return;
      }
      toast.error("Failed to update category status");
    }
  };

  const handleDelete = async (id: string) => {
    const toastId = toast.loading("Deleting category...");
    try {
      await productService.deleteCategory(id);
      toast.success("Category deleted successfully", { id: toastId });
      fetchCategories();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      if (error.response?.status === 401) {
        router.push("/admin/login");
        return;
      }
      toast.error(
        error.response?.data?.message || "Failed to delete category",
        { id: toastId }
      );
    }
  };

  const confirmDelete = (id: string) => {
    toast.custom(
      (t) => (
        <div className="flex flex-col gap-3 bg-white p-5 rounded-lg shadow-xl border border-gray-100 max-w-sm">
          <h3 className="font-medium text-gray-800">Confirm Deletion</h3>
          <p className="text-gray-600 text-sm">
            Are you sure you want to delete this category? This action cannot be
            undone.
          </p>
          <div className="flex gap-3 justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                handleDelete(id);
                toast.dismiss(t.id);
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      ),
      {
        duration: 6000,
        position: "top-center",
      }
    );
  };

  if (!isInitialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Categories</h1>
            <p className="text-gray-500 mt-1">Manage your store categories</p>
          </div>
          <Button
            onClick={() => router.push("/admin/categories/create")}
            className="flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
            Add Category
          </Button>
        </div>

        {categories.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-800 mb-2">
              No categories found
            </h2>
            <p className="text-gray-500 mb-6">
              Create your first category to organize your products
            </p>
            <Button onClick={() => router.push("/admin/categories/create")}>
              Add First Category
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div
                key={category._id}
                className="bg-white rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                {/* Image Container */}
                <div className="relative h-48 w-full bg-gray-100">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 truncate pr-2">
                      {category.name}
                    </h2>
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        category.active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {category.active ? "Active" : "Unlisted"}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                    {category.description || "No description provided"}
                  </p>

                  <div className="flex flex-col space-y-3">
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        className="flex-1 flex justify-center items-center gap-2"
                        onClick={() =>
                          router.push(`/admin/categories/${category._id}/edit`)
                        }
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit
                      </Button>
                      <Button
                        variant={category.active ? "destructive" : "default"}
                        className="flex-1 flex justify-center items-center gap-2"
                        onClick={() =>
                          handleToggleStatus(category._id, category.active)
                        }
                      >
                        {category.active ? (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                              />
                            </svg>
                            Unlist
                          </>
                        ) : (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            List
                          </>
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 hover:bg-red-50 hover:border-red-300"
                      onClick={() => confirmDelete(category._id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
