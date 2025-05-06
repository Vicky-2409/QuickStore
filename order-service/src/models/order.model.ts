import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  items: {
    product: {
      _id: string;
      name: string;
      price: number;
      imageUrl?: string;
    };
    quantity: number;
  }[];
  total: number;
  status:
    | "pending"
    | "accepted"
    | "assigned"
    | "picked_up"
    | "on_the_way"
    | "delivered";
  paymentStatus: "pending" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
  userEmail: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

const OrderSchema: Schema = new Schema({
  items: [
    {
      product: {
        _id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        imageUrl: { type: String },
      },
      quantity: { type: Number, required: true },
    },
  ],
  total: { type: Number, required: true },
  status: {
    type: String,
    required: true,
    enum: [
      "pending",
      "accepted",
      "assigned",
      "picked_up",
      "on_the_way",
      "delivered",
    ],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  userEmail: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
  },
});

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
