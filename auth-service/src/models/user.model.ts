import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "../interfaces/user.interface";
import { UserRole, VehicleType } from "../enums/user.enum";

export interface IUserDocument extends Omit<IUser, "_id">, Document {
  isVerified: boolean;
  otp?: string;
  otpExpiry?: Date;
  refreshToken?: string;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    active: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Date },
    refreshToken: { type: String },
    vehicleType: {
      type: String,
      enum: Object.values(VehicleType),
      required: function (this: IUserDocument) {
        return this.role === UserRole.DELIVERY_PARTNER;
      },
    },
    vehicleNumber: { type: String },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUserDocument>("User", UserSchema);
