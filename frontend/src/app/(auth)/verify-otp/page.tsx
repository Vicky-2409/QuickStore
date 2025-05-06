"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { Form, Input, Button, message } from "antd";
import { AuthService } from "@/services/auth.service";
import { ShoppingBag, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function VerifyOTPPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [form] = Form.useForm();
  const [email, setEmail] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const pendingEmail = localStorage.getItem("pendingVerificationEmail");
    if (!pendingEmail) {
      message.error("No pending verification found. Please register first.");
      router.push("/register");
      return;
    }
    if (pendingEmail) {
      setEmail(pendingEmail); // This is now valid as setEmail can accept string or null
    }
  }, [router]);

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onFinish = async (values) => {
    try {
      if (!email) {
        message.error("Email not found. Please register again.");
        router.push("/register");
        return;
      }

      setLoading(true);
      const authService = new AuthService();
      await authService.verifyCustomerOTP({
        email,
        otp: values.otp,
      });

      message.success("Email verified successfully!");
      localStorage.removeItem("pendingVerificationEmail");
      router.push("/login");
    } catch (error: any) {
      if (error.message === "Invalid OTP") {
        message.error("The OTP you entered is incorrect. Please try again.");
      } else if (error.message === "OTP expired") {
        message.error("The OTP has expired. Please request a new one.");
      } else {
        message.error(error.message || "OTP verification failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      if (!email) {
        message.error("Email not found. Please register again.");
        router.push("/register");
        return;
      }

      setResendLoading(true);
      const authService = new AuthService();
      await authService.resendCustomerOTP(email);
      message.success("OTP resent successfully!");
      setCountdown(60); // Start 60-second countdown
    } catch (error: any) {
      message.error(error.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-emerald-500 py-4 px-6">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <ShoppingBag className="text-white" size={24} />
            <h1 className="text-xl font-bold text-white">QuickStore</h1>
          </div>
          <h2 className="text-center text-white text-2xl font-medium">Verify Your Email</h2>
        </div>
        
        {/* Form Section */}
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-emerald-100 p-3 rounded-full">
              <ShieldCheck size={32} className="text-emerald-600" />
            </div>
          </div>
          
          {email && (
            <div className="mb-6 text-center">
              <p className="text-gray-500 text-sm">
                We've sent a 6-digit verification code to
              </p>
              <div className="flex items-center justify-center mt-1">
                <Mail size={16} className="text-gray-400 mr-1" />
                <p className="text-gray-700 font-medium">{email}</p>
              </div>
            </div>
          )}
          
          <Form
            form={form}
            name="verify-otp"
            onFinish={onFinish}
          >
            <Form.Item
              name="otp"
              rules={[
                { required: true, message: "Please enter the verification code" },
                { len: 6, message: "Code must be 6 digits" },
              ]}
            >
              <Input
                placeholder="Enter 6-digit code"
                maxLength={6}
                size="large"
                style={{ 
                  height: '48px', 
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '18px',
                  letterSpacing: '8px',
                  marginBottom: '24px'
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: '16px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  borderColor: '#10b981',
                  fontWeight: '500',
                  fontSize: '16px'
                }}
              >
                Verify Code
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Button
              type="link"
              onClick={handleResendOTP}
              disabled={countdown > 0 || resendLoading}
              style={{
                color: '#10b981',
                fontWeight: '500',
                height: 'auto',
                padding: '0'
              }}
            >
              {countdown > 0 
                ? `Resend code in ${countdown}s` 
                : resendLoading 
                  ? "Sending..." 
                  : "Didn't receive code? Resend"}
            </Button>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link 
              href="/register"
              style={{ 
                color: '#6b7280',
                fontSize: '14px'
              }}
            >
              Use a different email address
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}