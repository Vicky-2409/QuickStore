"use client";

import React, { useState } from "react";
import { message } from "antd";
import {
  ShoppingCartOutlined,
  HeartOutlined,
  HeartFilled,
  StarFilled,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { addItemToCart, addToCart } from "@/store/slices/cartSlice";
import { AppDispatch } from "@/store";
import Image from "next/image";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  rating?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  image,
  description,
  rating = 0,
}) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // const handleAddToCart = async () => {
  //   if (product) {
  //     try {
  //       await cartService.addToCart(product._id, 1);
  //       dispatch(addItemToCart({ product, quantity: 1 }));
  //       message.success("Product added to cart!");
  //     } catch (error) {
  //       message.error("Failed to add product to cart");
  //     }
  //   }
  // };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await dispatch(
        addItemToCart({
          product: {
            _id: id,
            name,
            price,
            imageUrl: image,
            description,
            category: "default",
            stock: 0,
          },
          quantity: 1,
        })
      );
      await dispatch(addToCart({ productId: id, quantity: 1 })).unwrap();
      message.success({
        content: `${name} added to cart!`,
        style: {
          marginTop: "20px",
          borderRadius: "8px",
        },
      });
    } catch (error) {
      message.error({
        content: "Failed to add item to cart",
        style: {
          marginTop: "20px",
          borderRadius: "8px",
        },
      });
    }
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    message.info({
      content: isFavorite
        ? `${name} removed from favorites`
        : `${name} added to favorites!`,
      style: {
        marginTop: "20px",
        borderRadius: "8px",
      },
    });
  };

  const navigateToProduct = () => {
    router.push(`/products/${id}`);
  };

  const renderStars = () => {
    const stars: JSX.Element[] = [];
    const fullStars = Math.floor(rating);

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<StarFilled key={i} style={{ color: "#FFB800" }} />);
      } else {
        stars.push(<StarFilled key={i} style={{ color: "#E5E7EB" }} />);
      }
    }

    return (
      <div className="flex items-center gap-1">
        {stars}{" "}
        <span className="ml-1 text-gray-500 text-sm">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  return (
    <div
      className="relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={navigateToProduct}
    >
      {/* Favorite button */}

      {/* Image Container */}
      <div className="relative h-56 w-full overflow-hidden">
        <div
          className={`absolute inset-0 bg-black bg-opacity-0 ${
            isHovered ? "bg-opacity-5" : ""
          } transition-all duration-300`}
        />
        <div className="relative h-full w-full">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      </div>

      {/* Content Container */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium text-gray-900 line-clamp-1">
            {name}
          </h3>
          <span className="font-bold text-emerald-600">
            ${price.toFixed(2)}
          </span>
        </div>

        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{description}</p>

        <div className="flex justify-between items-center">
          {renderStars()}

          <button
            className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-1.5 px-3 rounded-full text-sm font-medium transition-all"
            onClick={handleAddToCart}
          >
            <ShoppingCartOutlined /> Add
          </button>
        </div>

        {/* Quick Add Button - Appears on Hover */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-emerald-600 text-white py-3 font-medium text-center transform transition-transform duration-300 ${
            isHovered ? "translate-y-0" : "translate-y-full"
          }`}
          onClick={handleAddToCart}
        >
          <ShoppingCartOutlined className="mr-2" /> Add to Cart
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
