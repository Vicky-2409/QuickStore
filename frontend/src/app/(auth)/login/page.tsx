"use client";

import { Form, Input, Button, message } from "antd";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { login } from "@/store/slices/authSlice";
import Link from "next/link";
import { AppDispatch, RootState } from "@/store/store";
import { ThunkDispatch } from "@reduxjs/toolkit";
import { AnyAction } from "redux";
import { useState } from "react";
import { ShoppingBag, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, AnyAction>>();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      console.log("Form values:", values);
      const result = await dispatch(login(values)).unwrap();
      console.log("Login result:", result);
      message.success("Login successful!");
      router.push("/home");
    } catch (error: any) {
      console.error("Login error:", error);
      message.error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
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
          <h2 className="text-center text-white text-2xl font-medium">Welcome Back</h2>
        </div>
        
        {/* Form Section */}
        <div className="p-6">
          <p className="text-center text-gray-500 mb-6">Sign in to continue shopping</p>
          
          <Form 
            form={form} 
            name="login" 
            onFinish={onFinish} 
            layout="vertical"
          >
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
                autoComplete="username"
                style={{ 
                  height: '42px', 
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "Please enter your password" }]}
            >
              <Input.Password
                prefix={<Lock className="text-gray-400" size={16} />}
                placeholder="Password"
                autoComplete="current-password"
                style={{ 
                  height: '42px', 
                  borderRadius: '8px',
                  marginBottom: '24px'
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: '24px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
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
                Sign In
              </Button>
            </Form.Item>
          </Form>

          {/* Links Section */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
              Don't have an account?{" "}
              <Link href="/register" style={{ color: '#10b981', fontWeight: '500' }}>
                Sign up now
              </Link>
            </p>
            <div>
              <Link
                href="/delivery-partner/login"
                style={{ 
                  color: '#6b7280',
                  fontSize: '14px'
                }}
              >
                Sign in as Delivery Partner
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}