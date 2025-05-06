import { IUserDocument } from "../models/user.model";
import { BaseRepository } from "./base.repository";
import { Model } from "mongoose";

export class UserRepository extends BaseRepository<IUserDocument> {
  constructor(model: Model<IUserDocument>) {
    super(model);
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return this.findOne({ email });
  }

  async updateByEmail(
    email: string,
    data: Partial<IUserDocument>
  ): Promise<IUserDocument | null> {
    return this.findOneAndUpdate({ email }, data);
  }

  async updateById(
    id: string,
    data: Partial<IUserDocument>
  ): Promise<IUserDocument | null> {
    return this.findOneAndUpdate({ _id: id }, data);
  }

  async updateOTP(
    email: string,
    otp: string,
    expiry: Date
  ): Promise<IUserDocument | null> {
    return this.model.findOneAndUpdate(
      { email },
      { otp, otpExpiry: expiry },
      { new: true }
    );
  }

  async verifyUser(email: string): Promise<IUserDocument | null> {
    return this.model.findOneAndUpdate(
      { email },
      { isVerified: true, otp: null, otpExpiry: null },
      { new: true }
    );
  }
}
