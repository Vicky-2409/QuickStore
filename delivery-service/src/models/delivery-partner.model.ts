import mongoose from "mongoose";

export interface DeliveryPartner extends mongoose.Document {
  email: string;
  socketId?: string;
  location?: {
    lat: number;
    lng: number;
  };
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryPartnerSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    socketId: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    available: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Check if model exists before creating it
export const DeliveryPartnerModel =
  mongoose.models.DeliveryPartner ||
  mongoose.model<DeliveryPartner>("DeliveryPartner", DeliveryPartnerSchema);
