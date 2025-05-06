import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Category } from "../../store/slices/categoriesSlice";

interface CategoryCardProps {
  category: Category;
  showDescription?: boolean;
  className?: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  showDescription = true,
  className = "",
}) => {
  return (
    <Link href={`/categories/${category._id}`}>
      <div
        className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}
      >
        <div className="relative h-48 w-full">
          {category.imageUrl ? (
            <Image
              src={category.imageUrl}
              alt={category.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">No image</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {category.name}
          </h3>
          {showDescription && category.description && (
            <p className="text-gray-600 text-sm">{category.description}</p>
          )}
          {!category.active && (
            <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mt-2">
              Inactive
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
