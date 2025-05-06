import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { UserService } from "../../services/userService";

interface UserState {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
  addresses: Array<{
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
  }>;
  wallet: {
    balance: number;
    transactions: Array<{
      id: string;
      amount: number;
      type: "credit" | "debit";
      description: string;
      date: string;
    }>;
  };
  wishlist: Array<{
    id: string;
    productId: string;
    addedAt: string;
  }>;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: UserState = {
  user: null,
  addresses: [],
  wallet: {
    balance: 0,
    transactions: [],
  },
  wishlist: [],
  status: "idle",
  error: null,
};

export const fetchUserProfile = createAsyncThunk(
  "user/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await UserService.getProfile();
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "user/updateProfile",
  async (
    data: {
      name?: string;
      email?: string;
      phone?: string;
      vehicleType?: string;
      vehicleNumber?: string;
      address?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await UserService.updateProfile(data);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

export const fetchAddresses = createAsyncThunk(
  "user/fetchAddresses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await UserService.getAddresses();
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

export const fetchWallet = createAsyncThunk(
  "user/fetchWallet",
  async (_, { rejectWithValue }) => {
    try {
      const response = await UserService.getWallet();
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

export const fetchWishlist = createAsyncThunk(
  "user/fetchWishlist",
  async (_, { rejectWithValue }) => {
    try {
      const response = await UserService.getWishlist();
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUser: (state) => {
      state.user = null;
      state.addresses = [];
      state.wallet = { balance: 0, transactions: [] };
      state.wishlist = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      // Update Profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
      })
      // Fetch Addresses
      .addCase(fetchAddresses.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.addresses = action.payload;
        state.error = null;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      // Fetch Wallet
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.wallet = action.payload;
      })
      // Fetch Wishlist
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.wishlist = action.payload;
      });
  },
});

export const { clearUser } = userSlice.actions;

export const selectUser = (state: RootState) => state.user.user;
export const selectAddresses = (state: RootState) => state.user.addresses;
export const selectWallet = (state: RootState) => state.user.wallet;
export const selectWishlist = (state: RootState) => state.user.wishlist;
export const selectUserStatus = (state: RootState) => state.user.status;
export const selectUserError = (state: RootState) => state.user.error;

export default userSlice.reducer;
