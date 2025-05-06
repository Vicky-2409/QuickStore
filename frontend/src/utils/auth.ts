import Cookies from "js-cookie";
import axios from "axios";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";

export const getAccessToken = (): string | null => {
  return Cookies.get(ACCESS_TOKEN_KEY) || null;
};

export const getRefreshToken = (): string | null => {
  return Cookies.get(REFRESH_TOKEN_KEY) || null;
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  // Access token expires in 1 hour
  const accessTokenExpiry = new Date();
  accessTokenExpiry.setHours(accessTokenExpiry.getHours() + 1);

  // Refresh token expires in 7 days
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

  Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
    path: "/",
    expires: accessTokenExpiry,
  });
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
    path: "/",
    expires: refreshTokenExpiry,
  });
};

export const removeTokens = (): void => {
  Cookies.remove(ACCESS_TOKEN_KEY, { path: "/" });
  Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
};

export const setUser = (user: any): void => {
  // User data expires in 7 days
  const userExpiry = new Date();
  userExpiry.setDate(userExpiry.getDate() + 7);

  Cookies.set(USER_KEY, JSON.stringify(user), {
    path: "/",
    expires: userExpiry,
  });
};

export const getUser = (): any => {
  const userStr = Cookies.get(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const removeUser = (): void => {
  Cookies.remove(USER_KEY, { path: "/" });
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiry = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expiry;
  } catch (error) {
    console.error("Error checking token expiry:", error);
    return true; // Consider invalid if we can't parse
  }
};

export const getTokenPayload = (token: string) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (error) {
    console.error("Error parsing token:", error);
    return null;
  }
};

export const isValidToken = (token: string | null): boolean => {
  if (!token) return false;
  return !isTokenExpired(token);
};

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      console.log("No refresh token found");
      return null;
    }

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      { refreshToken },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.accessToken) {
      setTokens(response.data.accessToken, response.data.refreshToken);
      return response.data.accessToken;
    }

    return null;
  } catch (error) {
    console.error("Error refreshing token:", error);
    // Clear tokens on refresh failure
    removeTokens();
    removeUser();
    return null;
  }
};

export const getValidAccessToken = async (): Promise<string | null> => {
  try {
    const accessToken = getAccessToken();
    if (accessToken && isValidToken(accessToken)) {
      return accessToken;
    }

    // Try to refresh the token
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      return newAccessToken;
    }

    // If refresh fails, clear all auth data
    removeTokens();
    removeUser();
    return null;
  } catch (error) {
    console.error("Error getting valid access token:", error);
    removeTokens();
    removeUser();
    return null;
  }
};
