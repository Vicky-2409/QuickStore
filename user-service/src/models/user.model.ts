import mongoose, { Schema, Document, Types } from "mongoose";
import {
  IUser,
  IAddress,
  IWalletTransaction,
  ICartItem,
  UserRole,
  VehicleType,
} from "../interfaces/user.interface";

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  zipCode: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const WalletTransactionSchema = new Schema<IWalletTransaction>({
  type: { type: String, enum: ["credit", "debit"], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const CartItemSchema = new Schema<ICartItem>({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: { type: Number, required: true, min: 1 },
});

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
    },
    active: { type: Boolean, default: true },
    addresses: [AddressSchema],
    walletBalance: { type: Number, default: 0 },
    walletTransactions: [WalletTransactionSchema],
    cart: [CartItemSchema],
    vehicleType: {
      type: String,
      enum: Object.values(VehicleType),
      required: function (this: IUserDocument): boolean {
        return this.role === UserRole.DELIVERY_PARTNER;
      },
    },
    vehicleNumber: {
      type: String,
      required: function (this: IUserDocument): boolean {
        return this.role === UserRole.DELIVERY_PARTNER;
      },
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUserDocument>("User", UserSchema);
