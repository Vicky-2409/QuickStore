import { Service } from "typedi";
import { DeliveryPartnerRepository } from "../repositories/delivery-partner.repository";
import { logger } from "../utils/logger";

@Service()
export class DeliveryPartnerService {
  constructor(private repository: DeliveryPartnerRepository) {}

  async registerPartner(
    email: string,
    socketId: string,
    location: { lat: number; lng: number }
  ) {
    try {
      await this.repository.createOrUpdate({
        email,
        socketId,
        location,
        available: true,
      });
      logger.info(`Registered delivery partner: ${email}`);
    } catch (error) {
      logger.error(`Error registering delivery partner ${email}:`, error);
      throw error;
    }
  }

  async getAvailablePartners() {
    try {
      return await this.repository.findAvailable();
    } catch (error) {
      logger.error("Error fetching available partners:", error);
      throw error;
    }
  }

  async updatePartnerAvailability(email: string, available: boolean) {
    try {
      await this.repository.updateAvailability(email, available);
      logger.info(`Updated availability for partner ${email} to ${available}`);
      return await this.repository.findById(email);
    } catch (error) {
      logger.error(`Error updating availability for partner ${email}:`, error);
      throw error;
    }
  }

  async updatePartnerLocation(
    email: string,
    location: { lat: number; lng: number }
  ) {
    try {
      await this.repository.updateLocation(email, location);
      logger.info(`Updated location for partner ${email}`);
    } catch (error) {
      logger.error(`Error updating location for partner ${email}:`, error);
      throw error;
    }
  }

  async updateSocketId(email: string, socketId: string) {
    try {
      await this.repository.updateSocketId(email, socketId);
      logger.info(`Updated socket ID for partner ${email}`);
    } catch (error) {
      logger.error(`Error updating socket ID for partner ${email}:`, error);
      throw error;
    }
  }
}
