import jwt from "jsonwebtoken";
import { IUserDocument } from "../models/user.model";
import { UserRole } from "../enums/user.enum";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your-refresh-secret-key";

interface TokenPayload {
  email: string;
  role: UserRole;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export function generateTokens(email: string, role: UserRole, id: string): Tokens {
  const accessToken = jwt.sign(
    { email, role, id },
    JWT_SECRET,
    { expiresIn: "1h" } // Access token expires in 15 minutes
  );

  const refreshToken = jwt.sign(
    { email, role },
    REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" } // Refresh token expires in 7 days
  );

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
}

export function generateNewAccessToken(refreshToken: string): string {
  const payload = verifyRefreshToken(refreshToken);
  return jwt.sign({ email: payload.email, role: payload.role }, JWT_SECRET, {
    expiresIn: "15m",
  });
}
