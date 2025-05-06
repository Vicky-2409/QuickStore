"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Button, Input, Select, Space, Row, Col } from "antd";
import ProductCard from "@/components/common/ProductCard";
import {
  fetchProducts,
  selectProducts,
  selectProductsStatus,
  selectProductsError,
} from "@/store/slices/productsSlice";
import {
  fetchCategories,
  selectCategories,
  selectCategoriesStatus,
} from "@/store/slices/categoriesSlice";
import { AppDispatch } from "@/store";

const { Search } = Input;

const ShopPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const products = useSelector(selectProducts);
  const productsStatus = useSelector(selectProductsStatus);
  const productsError = useSelector(selectProductsError);
  const categories = useSelector(selectCategories);
  const categoriesStatus = useSelector(selectCategoriesStatus);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("price-asc");

  useEffect(() => {
    dispatch(fetchProducts({ page: 1, limit: 12 }));
    dispatch(fetchCategories());
  }, [dispatch]);

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  if (productsStatus || categoriesStatus) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (productsError) {
    return <div className="text-center py-8 text-red-500">{productsError}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Space direction="vertical" size="large" className="w-full">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Search
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>

          <Col span={6}>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: "100%" }}
            >
              <Select.Option value="price-asc">
                Price: Low to High
              </Select.Option>
              <Select.Option value="price-desc">
                Price: High to Low
              </Select.Option>
              <Select.Option value="name-asc">Name: A to Z</Select.Option>
              <Select.Option value="name-desc">Name: Z to A</Select.Option>
            </Select>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {filteredProducts.map((product) => (
            <Col key={product._id} xs={24} sm={12} md={8} lg={6}>
              <ProductCard
                id={product._id}
                name={product.name}
                price={product.price}
                image={product.imageUrl}
                description={product.description}
              />
            </Col>
          ))}
        </Row>

        {filteredProducts.length === 0 && (
          <Card className="text-center">
            <p className="text-gray-600 mb-4">
              No products found matching your criteria.
            </p>
            <Button
              type="default"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("");
              }}
            >
              Clear Filters
            </Button>
          </Card>
        )}
      </Space>
    </div>
  );
};

export default ShopPage;
