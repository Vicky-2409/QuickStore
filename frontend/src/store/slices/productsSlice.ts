import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../../store";
import { productService } from "@/services/productService";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "api-gateway-srv";

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  rating?: number;
}

interface ProductsState {
  items: Product[];
  featured: Product[];
  currentProduct: Product | null;
  status: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: ProductsState = {
  items: [],
  featured: [],
  currentProduct: null,
  status: false,
  error: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  },
};

// Async thunks
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async ({ page = 1, limit = 12 }: { page?: number; limit?: number }) => {
    const response = await productService.getProducts(page, limit);
    return response.data;
  }
);

export const fetchFeaturedProducts = createAsyncThunk(
  "products/fetchFeatured",
  async () => {
    const response = await axios.get(`${API_URL}/api/products/featured`);
    return response.data;
  }
);

export const fetchProductById = createAsyncThunk(
  "products/fetchProductById",
  async (id: string) => {
    const response = await productService.getProductById(id);
    return response.data;
  }
);

export const fetchProductsByCategory = createAsyncThunk(
  "products/fetchByCategory",
  async (categoryId: string) => {
    const response = await axios.get(
      `${API_URL}/api/products/category/${categoryId}`
    );
    return response.data;
  }
);

export const searchProducts = createAsyncThunk(
  "products/search",
  async (query: string) => {
    const response = await axios.get(
      `${API_URL}/api/products/search?query=${query}`
    );
    return response.data;
  }
);

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.status = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = false;
        state.items = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = false;
        state.error = action.error.message || "Failed to fetch products";
      })
      // Fetch Featured Products
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.status = true;
        state.error = null;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.status = false;
        state.featured = action.payload.data;
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.status = false;
        state.error =
          action.error.message || "Failed to fetch featured products";
      })
      // Fetch Product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.status = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.status = false;
        state.currentProduct = action.payload.data;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.status = false;
        state.error = action.error.message || "Failed to fetch product";
      })
      // Fetch Products by Category
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.status = true;
        state.error = null;
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.status = false;
        state.items = action.payload.data;
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.status = false;
        state.error =
          action.error.message || "Failed to fetch products by category";
      })
      // Search Products
      .addCase(searchProducts.pending, (state) => {
        state.status = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.status = false;
        state.items = action.payload.data;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.status = false;
        state.error = action.error.message || "Failed to search products";
      });
  },
});

export const { clearCurrentProduct } = productsSlice.actions;

// Selectors
export const selectProducts = (state: RootState) => state.products.items;
export const selectFeaturedProducts = (state: RootState) =>
  state.products.featured;
export const selectCurrentProduct = (state: RootState) =>
  state.products.currentProduct;
export const selectProductsStatus = (state: RootState) => state.products.status;
export const selectProductsError = (state: RootState) => state.products.error;
export const selectProductsPagination = (state: RootState) =>
  state.products.pagination;

export default productsSlice.reducer;
