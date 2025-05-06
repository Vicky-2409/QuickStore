import mongoose, { Document, Schema } from "mongoose";

export interface IOrder extends Document {
  orderId: string;
  customerEmail: string;
  customerAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  assignedPartnerId: string | null;
  status: "pending" | "assigned" | "picked_up" | "delivered" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    customerEmail: { type: String, required: true },
    customerAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    assignedPartnerId: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "assigned", "picked_up", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Check if model exists before creating it
export const Order =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
