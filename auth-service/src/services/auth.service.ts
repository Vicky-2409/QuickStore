import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import {
  IUser,
  IUserCreate,
  IUserLogin,
  IUserVerifyOTP,
  IUserResponse,
  IUserVerifyResponse,
} from "../interfaces/user.interface";
import { User, IUserDocument } from "../models/user.model";
import { UserRole } from "../enums/user.enum";
import { AppError } from "../utils/appError";
import dotenv from "dotenv";
import { generateOTP, sendOTPEmail } from "../utils/otp.utils";
import { comparePassword, hashPassword } from "../utils/password.utils";
import {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  generateNewAccessToken,
} from "../utils/token.utils";
import { BaseRepository } from "../repositories/base.repository";
import {
  UserServiceProducer,
  DeliveryServiceProducer,
} from "../rabbitmq/producer";

dotenv.config();

export class AuthService {
  private userRepository: BaseRepository<IUserDocument>;
  private transporter: nodemailer.Transporter;
  public userServiceProducer: UserServiceProducer;
  public deliveryServiceProducer: DeliveryServiceProducer;

  constructor(
    userRepository: BaseRepository<IUserDocument>,
    rabbitMQUrl: string
  ) {
    this.userRepository = userRepository;
    this.userServiceProducer = new UserServiceProducer(rabbitMQUrl);
    this.deliveryServiceProducer = new DeliveryServiceProducer(rabbitMQUrl);
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  private async sendOTP(email: string, otp: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verify your email",
        text: `Your OTP is: ${otp}`,
      });
    } catch (error) {
      console.error("Error sending OTP email:", error);
      throw new Error("Failed to send OTP email");
    }
  }

  async register(data: IUserCreate): Promise<IUserDocument> {
    try {
      if (!data.email || !data.password) {
        throw new Error("Email and password are required");
      }

      const existingUser = await this.userRepository.findOne({
        email: data.email,
      });
      if (existingUser) {
        throw new Error("User already exists");
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      console.log("Creating user with OTP:", {
        email: data.email,
        otp,
        otpExpiry,
        role: data.role,
      });

      const user = await this.userRepository.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: data.role,
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehicleNumber,
        otp,
        otpExpiry,
        isVerified: false,
      });

      // Publish user registration event to User Service
      await this.userServiceProducer.publishUserRegistration(
        user._id.toString(),
        user.email,
        user.role,
        user.name,
        user.phone,
        hashedPassword,
        user.vehicleType,
        user.vehicleNumber
      );

      // If it's a delivery partner, also publish to Delivery Service
      if (user.role === UserRole.DELIVERY_PARTNER) {
        await this.deliveryServiceProducer.publishDeliveryPartnerRegistration(
          user.email,
          user.name,
          user.phone,
          user.vehicleType!,
          user.vehicleNumber!
        );
      }

      // Send OTP email
      await this.sendOTP(user.email, otp);

      return user;
    } catch (error) {
      console.error("Error in register service:", error);
      throw error;
    }
  }

  async login(data: IUserLogin): Promise<IUserResponse> {
    try {
      // Convert role to lowercase for case-insensitive comparison
      const role = (data.type || data.role)?.toLowerCase();
      if (!role) {
        throw new AppError("Role/type is required", 400);
      }

      const user = await User.findOne({
        email: data.email,
        role: role,
      });

      if (!user) {
        throw new AppError("Invalid credentials", 401);
      }

      const isPasswordValid = await bcrypt.compare(
        data.password,
        user.password
      );

      if (!isPasswordValid) {
        throw new AppError("Invalid credentials", 401);
      }

      if (!user.isVerified) {
        throw new AppError("Please verify your email first", 403);
      }

      const { accessToken, refreshToken } = generateTokens(
        user.email,
        user.role,
        user._id.toString()
      );

      // Store refresh token in user document
      user.refreshToken = refreshToken;
      await user.save();

      return {
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const user = await User.findOne({ refreshToken });
      if (!user) {
        throw new AppError("Invalid refresh token", 401);
      }

      // Verify the refresh token
      verifyRefreshToken(refreshToken);

      // Generate new access token
      const accessToken = generateNewAccessToken(refreshToken);

      return { accessToken };
    } catch (error) {
      console.error("Token refresh error:", error);
      throw error;
    }
  }

  async logout(email: string): Promise<void> {
    try {
      await User.findOneAndUpdate({ email }, { refreshToken: null });
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }

  async verifyOTP(data: IUserVerifyOTP): Promise<IUserVerifyResponse> {
    try {
      console.log("Verifying OTP for:", { email: data.email, type: data.type });

      // First find user by email only
      const user = await User.findOne({ email: data.email });

      if (!user) {
        throw new Error("User not found");
      }

      console.log("Found user:", {
        email: user.email,
        role: user.role,
        otp: user.otp,
        otpExpiry: user.otpExpiry,
        isVerified: user.isVerified,
      });

      if (user.isVerified) {
        const token = jwt.sign(
          { id: user._id.toString(), role: user.role },
          process.env.JWT_SECRET || "your-secret-key",
          { expiresIn: "1d" }
        );

        return {
          success: true,
          message: "User is already verified",
          data: {
            token,
            user: {
              _id: user._id,
              email: user.email,
              name: user.name,
              phone: user.phone,
              role: user.role,
              isVerified: user.isVerified,
            },
          },
        };
      }

      if (!user.otp) {
        throw new Error("No OTP found. Please request a new OTP");
      }

      if (user.otp !== data.otp) {
        console.log("OTP mismatch:", {
          stored: user.otp,
          received: data.otp,
          user: {
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
          },
        });
        throw new Error("Invalid OTP");
      }

      if (user.otpExpiry && user.otpExpiry < new Date()) {
        throw new Error("OTP expired");
      }

      // Only update isVerified, don't clear OTP fields
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }

      const token = jwt.sign(
        { id: user._id.toString(), role: user.role },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "1d" }
      );

      return {
        success: true,
        message: "OTP verified successfully",
        data: {
          token,
          user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            isVerified: true,
          },
        },
      };
    } catch (error) {
      console.error("OTP verification error:", error);
      throw error;
    }
  }

  async resendOTP(email: string, type: UserRole): Promise<void> {
    try {
      const user = await User.findOne({ email, role: type });
      if (!user) {
        throw new Error("User not found");
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();

      await this.sendOTP(email, otp);
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser(email: string): Promise<IUserDocument> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  async getAllUsers(): Promise<IUserDocument[]> {
    const users = await User.find({ role: { $ne: "admin" } }).select(
      "-password"
    );
    return users;
  }

  async toggleUserStatus(
    userId: string,
    active: boolean
  ): Promise<IUserDocument> {
    const user = await User.findByIdAndUpdate(
      userId,
      { active },
      { new: true, runValidators: false }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }
}
