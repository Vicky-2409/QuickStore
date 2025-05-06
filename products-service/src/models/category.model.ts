import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
  name: string;
  description: string;
  active: boolean;
  deleted?: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    active: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false },
    imageUrl: { type: String },
  },
  {
    timestamps: true,
  }
);

export const CategoryModel = mongoose.model<ICategory>(
  "Category",
  categorySchema
);
