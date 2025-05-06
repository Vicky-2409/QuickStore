import { User, IUserDocument } from "../models/user.model";
import { AppError } from "../utils/appError";
import mongoose from "mongoose";
import {
  IAddress,
  IWalletTransaction,
  ICartItem,
} from "../interfaces/user.interface";

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

const DELIVERY_PARTNER_FIELDS = {
  ...USER_FIELDS,
  vehicleType: 1,
  vehicleNumber: 1,
};

export class UserRepository {
  async findAll(): Promise<IUserDocument[]> {
    try {
      return await User.find({}).select(USER_FIELDS).lean();
    } catch (error) {
      console.error("Repository Error - findAll:", error);
      throw new AppError("Failed to fetch users", 500);
    }
  }

  async findById(id: string): Promise<IUserDocument | null> {
    try {
      return await User.findById(id).select(USER_FIELDS).lean();
    } catch (error) {
      console.error("Repository Error - findById:", error);
      throw new AppError("Failed to fetch user", 500);
    }
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    try {
      const user = await User.findOne({ email }).select(USER_FIELDS).lean();
      if (user?.role === "delivery_partner") {
        return await User.findOne({ email }).select(DELIVERY_PARTNER_FIELDS).lean();
      } else {
        return user;
      }
    } catch (error) {
      console.error("Repository Error - findByEmail:", error);
      throw new AppError("Failed to fetch user", 500);
    }
  }

  async updateById(
    id: string,
    data: Partial<IUserDocument>
  ): Promise<IUserDocument | null> {
    try {
      return await User.findByIdAndUpdate(id, { $set: data }, { new: true })
        .select(USER_FIELDS)
        .lean();
    } catch (error) {
      console.error("Repository Error - updateById:", error);
      throw new AppError("Failed to update user", 500);
    }
  }

  async updateByEmail(
    email: string,
    data: Partial<IUserDocument>
  ): Promise<IUserDocument | null> {
    try {
      return await User.findOneAndUpdate(
        { email },
        { $set: data },
        { new: true }
      )
        .select(USER_FIELDS)
        .lean();
    } catch (error) {
      console.error("Repository Error - updateByEmail:", error);
      throw new AppError("Failed to update user", 500);
    }
  }

  async toggleStatus(
    id: string,
    active: boolean
  ): Promise<IUserDocument | null> {
    try {
      return await User.findByIdAndUpdate(id, { active }, { new: true })
        .select(USER_FIELDS)
        .lean();
    } catch (error) {
      console.error("Repository Error - toggleStatus:", error);
      throw new AppError("Failed to update user status", 500);
    }
  }

  // Address methods
  async addAddress(
    email: string,
    address: IAddress
  ): Promise<IUserDocument | null> {
    try {
      return await User.findOneAndUpdate(
        { email },
        { $push: { addresses: address } },
        { new: true }
      )
        .select(USER_FIELDS)
        .lean();
    } catch (error) {
      console.error("Repository Error - addAddress:", error);
      throw new AppError("Failed to add address", 500);
    }
  }

  async updateAddress(
    email: string,
    addressId: string,
    address: Partial<IAddress>
  ): Promise<IUserDocument | null> {
    try {
      return await User.findOneAndUpdate(
        {
          email,
          "addresses._id": new mongoose.Types.ObjectId(addressId),
        },
        {
          $set: {
            "addresses.$.street": address.street,
            "addresses.$.city": address.city,
            "addresses.$.state": address.state,
            "addresses.$.country": address.country,
            "addresses.$.zipCode": address.zipCode,
            "addresses.$.isDefault": address.isDefault,
          },
        },
        { new: true }
      )
        .select(USER_FIELDS)
        .lean();
    } catch (error) {
      console.error("Repository Error - updateAddress:", error);
      throw new AppError("Failed to update address", 500);
    }
  }

  async deleteAddress(
    email: string,
    addressId: string
  ): Promise<IUserDocument | null> {
    try {
      return await User.findOneAndUpdate(
        { email },
        {
          $pull: { addresses: { _id: new mongoose.Types.ObjectId(addressId) } },
        },
        { new: true }
      )
        .select(USER_FIELDS)
        .lean();
    } catch (error) {
      console.error("Repository Error - deleteAddress:", error);
      throw new AppError("Failed to delete address", 500);
    }
  }

  // Wallet methods
  async addWalletTransaction(
    email: string,
    transaction: IWalletTransaction
  ): Promise<IUserDocument | null> {
    try {
      return await User.findOneAndUpdate(
        { email },
        { $push: { wallet: transaction } },
        { new: true }
      )
        .select(USER_FIELDS)
        .lean();
    } catch (error) {
      console.error("Repository Error - addWalletTransaction:", error);
      throw new AppError("Failed to add wallet transaction", 500);
    }
  }

  // Cart methods
  async getCart(email: string): Promise<IUserDocument | null> {
    try {
      return await User.findOne({ email }).select(USER_FIELDS).lean();
    } catch (error) {
      console.error("Repository Error - getCart:", error);
      throw new AppError("Failed to get cart", 500);
    }
  }

  async findCartItem(
    email: string,
    productId: string
  ): Promise<IUserDocument | null> {
    try {
      return await User.findOne({
        email,
        "cart.productId": productId,
      })
        .select(USER_FIELDS)
        .lean();
    } catch (error) {
      console.error("Repository Error - findCartItem:", error);
      throw new AppError("Failed to find cart item", 500);
    }
  }

  async updateCartItem(
    email: string,
    cartItem: ICartItem
  ): Promise<IUserDocument | null> {
    try {
      return await User.findOneAndUpdate(
        {
          email,
          "cart.productId": cartItem.productId,
        },
        {
          $set: { "cart.$.quantity": cartItem.quantity },
        },
        { new: true }
      )
        .select(USER_FIELDS)
        .lean();
    } catch (error) {
      console.error("Repository Error - updateCartItem:", error);
      throw new AppError("Failed to update cart item", 500);
    }
  }

  async addCartItem(
    email: string,
    cartItem: ICartItem
  ): Promise<IUserDocument | null> {
    try {
      return await User.findOneAndUpdate(
        { email },
        { $push: { cart: cartItem } },
        { new: true }
      )
        .select(USER_FIELDS)
        .lean();
    } catch (error) {
      console.error("Repository Error - addCartItem:", error);
      throw new AppError("Failed to add cart item", 500);
    }
  }

  async removeFromCart(
    email: string,
    productId: string
  ): Promise<IUserDocument | null> {
    try {
      return await User.findOneAndUpdate(
        { email },
        { $pull: { cart: { productId } } },
        { new: true }
      )
        .select(USER_FIELDS)
        .lean();
    } catch (error) {
      console.error("Repository Error - removeFromCart:", error);
      throw new AppError("Failed to remove from cart", 500);
    }
  }

  async clearCart(email: string): Promise<IUserDocument | null> {
    try {
      return await User.findOneAndUpdate(
        { email },
        { $unset: { cart: 1 } },
        { new: true }
      )
        .select(USER_FIELDS)
        .lean();
    } catch (error) {
      console.error("Repository Error - clearCart:", error);
      throw new AppError("Failed to clear cart", 500);
    }
  }
}
