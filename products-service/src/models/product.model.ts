import mongoose, { Schema, Document, Types } from "mongoose";
import { ICategory } from "./category.model";

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  categoryId: Types.ObjectId;
  stock: number;
  active: boolean;
  featured?: boolean;
  inStock?: boolean;
  deleted?: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  attributes: Map<string, string>;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    imageUrl: {
      type: String,
    },
    attributes: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
productSchema.index({ name: "text", description: "text" });
productSchema.index({ categoryId: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ inStock: 1 });

export const Product = mongoose.model<IProduct>("Product", productSchema);
