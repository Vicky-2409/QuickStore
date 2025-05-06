import { Types } from "mongoose";

export interface IAddress {
  _id?: Types.ObjectId;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
}

export interface IWalletTransaction {
  _id?: Types.ObjectId;
  type: "credit" | "debit";
  amount: number;
  description: string;
  createdAt?: Date;
}

export interface ICartItem {
  _id?: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
}

export enum UserRole {
  CUSTOMER = "customer",
  DELIVERY_PARTNER = "delivery_partner",
  ADMIN = "admin",
}

export enum VehicleType {
  BIKE = "BIKE",
  CAR = "CAR",
  VAN = "VAN",
}

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
  active: boolean;
  addresses: IAddress[];
  walletBalance: number;
  walletTransactions: IWalletTransaction[];
  cart: ICartItem[];
  vehicleType?: VehicleType; // For delivery partners
  vehicleNumber?: string; // For delivery partners
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserRegistrationEvent {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  password: string;
  vehicleType?: VehicleType;
  vehicleNumber?: string;
  timestamp: string;
}
