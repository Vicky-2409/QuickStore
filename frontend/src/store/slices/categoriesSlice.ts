import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../../store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "api-gateway-srv";

export interface Category {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
}

interface CategoriesState {
  items: Category[];
  active: Category[];
  currentCategory: Category | null;
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  items: [],
  active: [],
  currentCategory: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async () => {
    const response = await axios.get(`${API_URL}/api/categories`);
    return response.data;
  }
);

export const fetchActiveCategories = createAsyncThunk(
  "categories/fetchActive",
  async () => {
    const response = await axios.get(`${API_URL}/api/categories/active`);
    return response.data;
  }
);

export const fetchCategoryById = createAsyncThunk(
  "categories/fetchById",
  async (id: string) => {
    const response = await axios.get(`${API_URL}/api/categories/${id}`);
    return response.data;
  }
);

export const createCategory = createAsyncThunk(
  "categories/create",
  async (category: Partial<Category>) => {
    const response = await axios.post(`${API_URL}/api/categories`, category);
    return response.data;
  }
);

export const updateCategory = createAsyncThunk(
  "categories/update",
  async ({ id, data }: { id: string; data: Partial<Category> }) => {
    const response = await axios.put(`${API_URL}/api/categories/${id}`, data);
    return response.data;
  }
);

export const deleteCategory = createAsyncThunk(
  "categories/delete",
  async (id: string) => {
    await axios.delete(`${API_URL}/api/categories/${id}`);
    return id;
  }
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    clearCurrentCategory: (state) => {
      state.currentCategory = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch categories";
      })
      // Fetch Active Categories
      .addCase(fetchActiveCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.active = action.payload.data;
      })
      .addCase(fetchActiveCategories.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to fetch active categories";
      })
      // Fetch Category by ID
      .addCase(fetchCategoryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCategory = action.payload.data;
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch category";
      })
      // Create Category
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload.data);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create category";
      })
      // Update Category
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(
          (cat) => cat._id === action.payload.data._id
        );
        if (index !== -1) {
          state.items[index] = action.payload.data;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update category";
      })
      // Delete Category
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((cat) => cat._id !== action.payload);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete category";
      });
  },
});

export const { clearCurrentCategory } = categoriesSlice.actions;

// Selectors
export const selectCategories = (state: RootState) => state.categories.items;
export const selectActiveCategories = (state: RootState) =>
  state.categories.active;
export const selectCurrentCategory = (state: RootState) =>
  state.categories.currentCategory;
export const selectCategoriesStatus = (state: RootState) =>
  state.categories.loading;
export const selectCategoriesError = (state: RootState) =>
  state.categories.error;

export default categoriesSlice.reducer;
