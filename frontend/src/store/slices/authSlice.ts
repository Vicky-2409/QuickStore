import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { authService } from "../../services/auth.service";
import {
  getAccessToken,
  getRefreshToken,
  getUser,
  setTokens,
  setUser,
  isValidToken,
} from "@/utils/auth";
import { UserRole } from "@/enums/user.enum";

interface AuthState {
  user: {
    _id: string;
    email: string;
    name?: string;
    phone?: string;
    role: string;
    isVerified: boolean;
  } | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  isInitialized: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: "idle",
  error: null,
  isInitialized: false,
  isAuthenticated: false,
  isLoading: false,
};

export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { dispatch }) => {
    try {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();
      const user = getUser();

      if (accessToken && refreshToken && user && isValidToken(accessToken)) {
        try {
          // Verify token and get fresh user data
          const response = await authService.getCurrentUser();
          if (response) {
            dispatch(
              setCredentials({
                user: response,
                accessToken,
                refreshToken,
              })
            );
          } else {
            // If getCurrentUser fails, clear auth state
            dispatch(logout());
          }
        } catch (error) {
          console.error("Error verifying token:", error);
          dispatch(logout());
        }
      } else {
        // If no valid tokens, clear auth state
        dispatch(logout());
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      dispatch(logout());
    } finally {
      dispatch(setInitialized());
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: { email: string; password: string; role?: string }) => {
    const response = await authService.login({
      ...credentials,
      role: (credentials.role as UserRole) || UserRole.CUSTOMER,
    });
    return response.data;
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.error = null;
      state.isAuthenticated = true;

      // Persist to cookies
      setTokens(accessToken, refreshToken);
      setUser(user);
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.status = "idle";
      state.error = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = {
          _id: action.payload._id,
          email: action.payload.email,
          name: action.payload.name,
          phone: action.payload.phone,
          role: action.payload.role,
          isVerified: action.payload.isVerified,
        };
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
        state.isAuthenticated = true;

        // Persist to cookies
        setTokens(action.payload.accessToken, action.payload.refreshToken);
        setUser(action.payload);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Login failed";
        state.isAuthenticated = false;
      });
  },
});

export const { setCredentials, setInitialized, logout } = authSlice.actions;

export const selectUser = (state: RootState) => state.auth.user;
export const selectToken = (state: RootState) => state.auth.accessToken;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectIsInitialized = (state: RootState) =>
  state.auth.isInitialized;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;

export default authSlice.reducer;
