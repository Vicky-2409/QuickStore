import { User } from "../models/user.model";
import { hashPassword } from "./password.utils";

export async function seedAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@gmail.com" });
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Create admin user
    const hashedPassword = await hashPassword("Admin@123");
    const admin = new User({
      name: "Admin",
      email: "admin@gmail.com",
      phone: "1234567890",
      password: hashedPassword,
      role: "admin",
      isVerified: true,
    });

    await admin.save();
    console.log("Admin user created successfully");
  } catch (error: any) {
    if (error.code === 11000) {
      console.log("Admin user already exists (duplicate email)");
      return;
    }
    console.error("Error seeding admin:", error);
  }
}
