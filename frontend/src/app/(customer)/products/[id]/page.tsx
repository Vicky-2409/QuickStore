"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { message, Spin } from "antd";
import {
  ShoppingCartOutlined,
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
  StarFilled,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { AppDispatch } from "@/store";
import {
  fetchProductById,
  selectCurrentProduct,
  selectProductsStatus,
  selectProductsError,
} from "@/store/slices/productsSlice";
import { addItemToCart } from "@/store/slices/cartSlice";
import { cartService } from "@/services/cartService";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import Image from "next/image";
import { useRouter } from "next/navigation";

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const product = useSelector(selectCurrentProduct);
  const status = useSelector(selectProductsStatus);
  const error = useSelector(selectProductsError);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Mock multiple images (in a real app, this would come from the product data)
  const productImages = product
    ? [
        product.imageUrl,
        product.imageUrl, // Normally these would be different images
        product.imageUrl,
      ]
    : [];

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id as string));
    }
  }, [dispatch, id]);

  const handleAddToCart = async () => {
    if (product) {
      try {
        await cartService.addToCart(product._id, quantity);
        dispatch(addItemToCart({ product, quantity }));
        message.success({
          content: `${quantity} ${product.name} added to cart!`,
          icon: <CheckCircleFilled style={{ color: "#10b981" }} />,
          style: {
            marginTop: "20px",
            borderRadius: "8px",
          },
        });
      } catch (error) {
        message.error({
          content: "Failed to add product to cart",
          icon: <ExclamationCircleFilled style={{ color: "#ef4444" }} />,
          style: {
            marginTop: "20px",
            borderRadius: "8px",
          },
        });
      }
    }
  };

  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    if (product) {
      message.info({
        content: isFavorite
          ? `${product.name} removed from favorites`
          : `${product.name} added to favorites!`,
        style: {
          marginTop: "20px",
          borderRadius: "8px",
        },
      });
    }
  };

  const renderStars = (rating: number) => {
    const stars: JSX.Element[] = [];
    const fullStars = Math.floor(rating);

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<StarFilled key={i} style={{ color: "#FFB800" }} />);
      } else {
        stars.push(<StarFilled key={i} style={{ color: "#E5E7EB" }} />);
      }
    }

    return stars;
  };

  const goBack = () => {
    router.back();
  };

  if (status) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Spin size="large" tip="Loading product..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <ExclamationCircleFilled
            style={{ fontSize: "48px", color: "#ef4444" }}
          />
          <h2 className="text-2xl font-semibold mt-4 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={goBack}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center justify-center mx-auto"
          >
            <ArrowLeftOutlined className="mr-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <ExclamationCircleFilled
            style={{ fontSize: "48px", color: "#ef4444" }}
          />
          <h2 className="text-2xl font-semibold mt-4 mb-2">
            Product Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't find the product you're looking for.
          </p>
          <button
            onClick={goBack}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center justify-center mx-auto"
          >
            <ArrowLeftOutlined className="mr-2" /> Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-12">
        {/* Breadcrumb and Back Button */}
        <div className="mb-8">
          <button
            onClick={goBack}
            className="flex items-center text-gray-600 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeftOutlined className="mr-2" /> Back to Products
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image Column */}
            <div className="bg-gray-100 p-6 md:p-10">
              <div className="sticky top-10">
                {/* Main Image */}
                <div className="aspect-w-1 aspect-h-1 mb-4 overflow-hidden rounded-xl bg-white flex items-center justify-center">
                  <img
                    src={productImages[activeImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Thumbnail Gallery */}
                <div className="flex gap-2 mt-4 justify-center">
                  {productImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        activeImageIndex === index
                          ? "border-emerald-500 shadow-md"
                          : "border-gray-200"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Details Column */}
            <div className="p-6 md:p-10">
              {/* Product Info */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {product.name}
                  </h1>
                  <div className="flex gap-2">
                    <button
                      onClick={toggleFavorite}
                      className={`p-2 rounded-full transition-colors ${
                        isFavorite
                          ? "bg-red-50 text-red-500"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}
                    >
                      {isFavorite ? <HeartFilled /> : <HeartOutlined />}
                    </button>
                    <button className="p-2 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors">
                      <ShareAltOutlined />
                    </button>
                  </div>
                </div>

                <div className="flex items-center mb-6">
                  <div className="flex">{renderStars(product.rating || 0)}</div>
                  <span className="ml-2 text-gray-500 text-sm">
                    ({product.rating || 0} ratings)
                  </span>
                </div>

                <div className="text-3xl font-bold text-emerald-600 mb-6">
                  ${product.price.toFixed(2)}
                </div>

                <div className="prose prose-sm text-gray-600 mb-8">
                  <p>{product.description}</p>
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center mb-6">
                <div
                  className={`flex items-center ${
                    product.stock > 0 ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {product.stock > 0 ? (
                    <>
                      <CheckCircleFilled className="mr-2" />
                      <span>In Stock</span>
                      <span className="ml-2 text-gray-500">
                        ({product.stock} available)
                      </span>
                    </>
                  ) : (
                    <>
                      <ExclamationCircleFilled className="mr-2" />
                      <span>Out of Stock</span>
                    </>
                  )}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-8">
                <label className="block text-gray-700 font-medium mb-2">
                  Quantity
                </label>
                <div className="flex items-center">
                  <button
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    className={`w-10 h-10 flex items-center justify-center rounded-l-lg border border-gray-300 ${
                      quantity <= 1
                        ? "bg-gray-100 text-gray-400"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    readOnly
                    className="w-16 h-10 border-t border-b border-gray-300 text-center text-gray-700"
                  />
                  <button
                    onClick={increaseQuantity}
                    disabled={product.stock <= quantity}
                    className={`w-10 h-10 flex items-center justify-center rounded-r-lg border border-gray-300 ${
                      product.stock <= quantity
                        ? "bg-gray-100 text-gray-400"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className={`w-full py-3 px-6 rounded-lg flex items-center justify-center font-medium transition-colors ${
                    product.stock > 0
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <ShoppingCartOutlined className="mr-2" />
                  Add to Cart
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Free Delivery
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      2-3 working days
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Returns
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      30 days return policy
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
