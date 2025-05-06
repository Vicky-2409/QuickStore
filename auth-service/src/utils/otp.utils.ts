import nodemailer from "nodemailer";

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  // Email sending logic will be implemented here
  console.log(`Sending OTP ${otp} to ${email}`);
}
