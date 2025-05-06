"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { Form, Input, Button, message } from "antd";
import { AuthService } from "@/services/auth.service";
import Link from "next/link";
import { ShoppingBag, Mail, Phone, User, Lock, Check } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      if (values.password !== values.confirmPassword) {
        message.error("Passwords do not match");
        return;
      }

      const authService = new AuthService();
      await authService.registerCustomer({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });

      message.success("Registration successful! Please verify your email.");
      localStorage.setItem("pendingVerificationEmail", values.email);
      router.push("/verify-otp");
    } catch (error: any) {
      message.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
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
          <h2 className="text-center text-white text-2xl font-medium">Create Account</h2>
        </div>
        
        {/* Form Section */}
        <div className="p-6">
          <Form
            form={form}
            name="register"
            layout="vertical"
            onFinish={onFinish}
          >
            <Form.Item
              name="name"
              rules={[{ required: true, message: "Please enter your name" }]}
            >
              <Input
                prefix={<User className="text-gray-400" size={16} />}
                placeholder="Full Name"
                style={{ 
                  height: '42px', 
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input
                prefix={<Mail className="text-gray-400" size={16} />}
                placeholder="Email Address"
                style={{ 
                  height: '42px', 
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[
                { required: true, message: "Please enter your phone number" },
              ]}
            >
              <Input
                prefix={<Phone className="text-gray-400" size={16} />}
                placeholder="Phone Number"
                style={{ 
                  height: '42px', 
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}
              />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Form.Item
                name="password"
                rules={[{ required: true, message: "Please enter a password" }]}
              >
                <Input.Password
                  prefix={<Lock className="text-gray-400" size={16} />}
                  placeholder="Password"
                  style={{ 
                    height: '42px', 
                    borderRadius: '8px'
                  }}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                rules={[
                  { required: true, message: "Please confirm your password" },
                ]}
              >
                <Input.Password
                  prefix={<Check className="text-gray-400" size={16} />}
                  placeholder="Confirm Password"
                  style={{ 
                    height: '42px', 
                    borderRadius: '8px'
                  }}
                />
              </Form.Item>
            </div>

            <Form.Item style={{ marginBottom: '0' }}>
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
                  marginTop: '16px',
                  fontWeight: '500',
                  fontSize: '16px'
                }}
              >
                Create Account
              </Button>
            </Form.Item>
          </Form>

          {/* Links Section */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: '#10b981', fontWeight: '500' }}>
                Sign in
              </Link>
            </p>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Want to deliver with us?{" "}
              <Link href="/delivery-partner/register" style={{ color: '#10b981', fontWeight: '500' }}>
                Register as a delivery partner
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}