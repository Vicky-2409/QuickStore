import { IUserDocument } from "../models/user.model";
import { AppError } from "../utils/appError";
import {
  IUser,
  IAddress,
  IWalletTransaction,
  ICartItem,
} from "../interfaces/user.interface";
import { RabbitMQProducer } from "../rabbitmq/producer";
import { UserRepository } from "../repositories/user.repository";
import mongoose from "mongoose";

// Define the fields we want to include in user responses
const USER_FIELDS = {
  _id: 1,
  name: 1,
  email: 1,
  phone: 1,
  role: 1,
  active: 1,
  addresses: 1,
  wallet: 1,
  cart: 1,
  createdAt: 1,
  updatedAt: 1,
};

export class UserService {
  private rabbitMQProducer: RabbitMQProducer;
  private userRepository: UserRepository;

  constructor() {
    const rabbitMQUrl = process.env.RABBITMQ_URL || "amqp://localhost";
    const exchangeName = process.env.EXCHANGE_NAME || "user-registration";
    this.rabbitMQProducer = new RabbitMQProducer(rabbitMQUrl, exchangeName);
    this.userRepository = new UserRepository();

    // Initialize RabbitMQ connection in the background
    this.rabbitMQProducer.connect().catch((error) => {
      console.error("Failed to initialize RabbitMQ connection:", error);
    });
  }

  // Admin methods
  async getAllUsers(): Promise<IUserDocument[]> {
    try {
      console.log("getAllUsers");
      const users = await this.userRepository.findAll();
      if (!users) {
        throw new AppError("No users found", 404);
      }
      return users;
    } catch (error) {
      console.error("Error in getAllUsers:", error);
      throw error instanceof AppError
        ? error
        : new AppError("Failed to fetch users", 500);
    }
  }

  async getUserById(id: string): Promise<IUserDocument> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  async toggleUserStatus(id: string, active: boolean): Promise<IUserDocument> {
    const user = await this.userRepository.toggleStatus(id, active);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  // Customer methods
  async updateUser(
    id: string,
    data: Partial<IUserDocument>
  ): Promise<IUserDocument> {
    const user = await this.userRepository.updateById(id, data);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  // Address methods
  async addAddress(email: string, address: IAddress): Promise<IUserDocument> {
    const user = await this.userRepository.addAddress(email, address);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  async updateAddress(
    email: string,
    addressId: string,
    address: Partial<IAddress>
  ): Promise<IUserDocument> {
    console.log("Service: Updating address with ID:", addressId);
    console.log("Service: User email:", email);
    console.log("Service: New address data:", address);

    const user = await this.userRepository.updateAddress(
      email,
      addressId,
      address
    );

    if (!user) {
      throw new AppError("User or address not found", 404);
    }
    console.log("Service: Update operation result:", user);
    return user;
  }

  // Wallet methods
  async addWalletTransaction(
    email: string,
    transaction: IWalletTransaction
  ): Promise<IUserDocument> {
    const user = await this.userRepository.addWalletTransaction(
      email,
      transaction
    );
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  // Cart methods
  async getCart(email: string): Promise<IUserDocument> {
    const user = await this.userRepository.getCart(email);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  async updateCart(email: string, cartItem: ICartItem): Promise<IUserDocument> {
    // First check if product exists in cart
    const user = await this.userRepository.findCartItem(
      email,
      cartItem.productId.toString()
    );

    if (user) {
      // Update existing cart item
      const updatedUser = await this.userRepository.updateCartItem(
        email,
        cartItem
      );
      if (!updatedUser) {
        throw new AppError("Failed to update cart item", 500);
      }
      return updatedUser;
    } else {
      // Add new cart item
      const newUser = await this.userRepository.addCartItem(email, cartItem);
      if (!newUser) {
        throw new AppError("Failed to add cart item", 500);
      }
      return newUser;
    }
  }

  async removeFromCart(
    email: string,
    productId: string
  ): Promise<IUserDocument> {
    const user = await this.userRepository.removeFromCart(email, productId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<IUserDocument> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  async updateUserByEmail(
    email: string,
    data: Partial<IUserDocument>
  ): Promise<IUserDocument> {
    const user = await this.userRepository.updateByEmail(email, data);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Only send RabbitMQ event if name or phone was updated
    if (data.name || data.phone) {
      try {
        await this.rabbitMQProducer.publishProfileUpdate(
          user._id.toString(),
          user.email,
          user.name,
          user.phone
        );
      } catch (error) {
        console.error("Failed to publish profile update event:", error);
      }
    }
    return user;
  }

  async updateUserProfile(
    id: string,
    data: Partial<IUserDocument>
  ): Promise<IUserDocument> {
    const user = await this.userRepository.updateById(id, data);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  async getAddresses(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user.addresses.map((address) => {
      const addressObj =
        address instanceof mongoose.Document ? address.toObject() : address;
      return {
        ...addressObj,
        _id: addressObj._id.toString(),
      };
    });
  }

  async deleteAddress(email: string, addressId: string) {
    console.log("Service: Deleting address with ID:", addressId);
    console.log("Service: User email:", email);

    const user = await this.userRepository.findByEmail(email);
    console.log("Service: Found user:", user ? "Yes" : "No");
    if (user) {
      console.log("Service: User addresses:", user.addresses);
    }

    const result = await this.userRepository.deleteAddress(email, addressId);

    if (!result) {
      throw new AppError("User not found", 404);
    }
    console.log("Service: Delete operation result:", result);
    return result;
  }

  async clearCart(email: string): Promise<IUserDocument> {
    const user = await this.userRepository.clearCart(email);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }
}
