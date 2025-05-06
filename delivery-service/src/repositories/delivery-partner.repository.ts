import { Service, Inject } from "typedi";
import mongoose, { Schema, Document, Model } from "mongoose";
import { logger } from "../utils/logger";
import { DeliveryPartner } from "../models/delivery-partner.model";

// Define MongoDB schema
const DeliveryPartnerSchema = new Schema({
  email: { type: String, required: true, unique: true },
  socketId: { type: String, required: false },
  location: {
    lat: { type: Number, required: false },
    lng: { type: Number, required: false },
  },
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Check if model exists before creating it
const DeliveryPartnerModel =
  mongoose.models.DeliveryPartner ||
  mongoose.model<DeliveryPartner>("DeliveryPartner", DeliveryPartnerSchema);

@Service()
export class DeliveryPartnerRepository {
  constructor(
    @Inject("deliveryPartnerModel")
    private model: Model<DeliveryPartner>
  ) {}

  async create(
    partnerData: Partial<DeliveryPartner>
  ): Promise<DeliveryPartner> {
    const partner = new this.model(partnerData);
    return partner.save();
  }

  async findById(email: string): Promise<DeliveryPartner> {
    const partner = await this.model.findOne({ email });

    if (!partner) {
      throw new Error(`Delivery partner with email ${email} not found`);
    }

    return partner;
  }

  async updateAvailability(
    email: string,
    available: boolean
  ): Promise<DeliveryPartner> {
    const updatedPartner = await this.model.findOneAndUpdate(
      { email },
      { available, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedPartner) {
      throw new Error(`Delivery partner with email ${email} not found`);
    }

    return updatedPartner;
  }

  async updateLocation(
    email: string,
    location: { lat: number; lng: number }
  ): Promise<DeliveryPartner> {
    const updatedPartner = await this.model.findOneAndUpdate(
      { email },
      { location, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedPartner) {
      throw new Error(`Delivery partner with email ${email} not found`);
    }

    return updatedPartner;
  }

  async updateSocketId(
    email: string,
    socketId: string
  ): Promise<DeliveryPartner> {
    const updatedPartner = await this.model.findOneAndUpdate(
      { email },
      { socketId, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedPartner) {
      throw new Error(`Delivery partner with email ${email} not found`);
    }

    return updatedPartner;
  }

  async getAvailablePartners(): Promise<DeliveryPartner[]> {
    return this.model.find({ available: true });
  }

  async findBySocketId(socketId: string): Promise<DeliveryPartner> {
    const partner = await this.model.findOne({ socketId });

    if (!partner) {
      throw new Error(`Delivery partner with socket ID ${socketId} not found`);
    }

    return partner;
  }

  async createOrUpdate(
    data: Partial<DeliveryPartner>
  ): Promise<DeliveryPartner> {
    try {
      const existing = await this.model.findOne({ email: data.email });
      if (existing) {
        const updatedPartner = await this.model.findOneAndUpdate(
          { email: data.email },
          data,
          { new: true }
        );

        if (!updatedPartner) {
          throw new Error(
            `Failed to update delivery partner with email ${data.email}`
          );
        }

        return updatedPartner;
      }

      const newPartner = await this.create(data);
      if (!newPartner) {
        throw new Error(
          `Failed to create new delivery partner with email ${data.email}`
        );
      }

      return newPartner;
    } catch (error) {
      logger.error("Error creating or updating delivery partner:", error);
      throw error;
    }
  }

  async findAvailable(): Promise<DeliveryPartner[]> {
    try {
      return await this.model.find({ available: true });
    } catch (error) {
      logger.error("Error finding available delivery partners:", error);
      throw error;
    }
  }
}
