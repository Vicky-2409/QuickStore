import { UserRole, VehicleType } from "../enums/user.enum";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  active: boolean;
  isVerified: boolean;
  otp?: string;
  otpExpiry?: Date;
  refreshToken?: string;
  vehicleType?: VehicleType;
  vehicleNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserCreate {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  vehicleType?: VehicleType;
  vehicleNumber?: string;
}

export interface IUserLogin {
  email: string;
  password: string;
  type?: UserRole;
  role?: UserRole;
}

export interface IUserVerifyOTP {
  email: string;
  otp: string;
  type: UserRole;
}

export interface IUserResponse {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
  role: UserRole;
  isVerified: boolean;
  accessToken: string;
  refreshToken: string;
}

export interface IUserVerifyResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      _id: string;
      email: string;
      name?: string;
      phone?: string;
      role: UserRole;
      isVerified: boolean;
    };
  };
}
