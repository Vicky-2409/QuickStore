import { UserRole } from "@/enums/user.enum";
import { VehicleType } from "@/enums/vehicle.enum";

export interface IAddress {
  _id?: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
}

export interface IWalletTransaction {
  _id?: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  createdAt?: Date;
}

export interface ICartItem {
  _id?: string;
  productId: string;
  quantity: number;
}

export interface User {
  _id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  active: boolean;
  isVerified: boolean;
  addresses: IAddress[];
  walletBalance: number;
  walletTransactions: IWalletTransaction[];
  cart: ICartItem[];
  vehicleType?: VehicleType;
  vehicleNumber?: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  customers: number;
  deliveryPartners: number;
  admins: number;
}
