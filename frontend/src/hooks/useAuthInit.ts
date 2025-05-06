"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  setCredentials,
  setInitialized,
  logout,
} from "@/store/slices/authSlice";
import { authService } from "@/services/auth.service";
import {
  getAccessToken,
  getRefreshToken,
  getUser,
  isValidToken,
  setTokens,
  setUser,
} from "@/utils/auth";

export const useAuthInit = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();
        const user = getUser();

        // If no tokens or user, clear auth state
        if (!accessToken || !refreshToken || !user) {
          dispatch(logout());
          dispatch(setInitialized());
          return;
        }

        // Try to use current token
        if (isValidToken(accessToken)) {
          try {
            const response = await authService.getCurrentUser();
            if (response) {
              // Update Redux state
              dispatch(
                setCredentials({
                  user: response,
                  accessToken,
                  refreshToken,
                })
              );
              dispatch(setInitialized());
              return;
            }
          } catch (error) {
            console.error("Error verifying token:", error);
          }
        }

        // Try to refresh token
        try {
          const { accessToken: newAccessToken } =
            await authService.refreshToken();
          if (newAccessToken) {
            const response = await authService.getCurrentUser();
            if (response) {
              // Update tokens and user in cookies
              setTokens(newAccessToken, refreshToken);
              setUser(response);

              // Update Redux state
              dispatch(
                setCredentials({
                  user: response,
                  accessToken: newAccessToken,
                  refreshToken,
                })
              );
              dispatch(setInitialized());
              return;
            }
          }
        } catch (error) {
          console.error("Token refresh failed:", error);
        }

        // If all attempts fail, logout
        dispatch(logout());
      } catch (error) {
        console.error("Auth initialization error:", error);
        dispatch(logout());
      } finally {
        dispatch(setInitialized());
      }
    };

    // Initialize auth state
    initAuth();
  }, [dispatch]);
};
