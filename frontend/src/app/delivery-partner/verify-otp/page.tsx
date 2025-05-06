"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/auth.service";

interface FormData {
  otp: string;
}

interface FormErrors {
  otp?: string;
  submit?: string;
}

// Create a client component that uses useSearchParams
function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";

  const [formData, setFormData] = useState<FormData>({
    otp: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!email) {
      router.push("/delivery-partner/register");
      return;
    }
  }, [email, router]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Only allow digits
    if (name === "otp" && !/^\d*$/.test(value)) return;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));

    // Auto-submit when 6 digits are entered
    if (name === "otp" && value.length === 6) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.otp) {
      setErrors((prev) => ({ ...prev, otp: "OTP is required" }));
      return;
    }

    if (formData.otp.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: "OTP must be 6 digits" }));
      return;
    }

    if (!email) return;

    setIsLoading(true);
    try {
      const response = await authService.verifyDeliveryPartnerOTP({
        email,
        otp: formData.otp,
      });

      if (response.data?.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: response.data.user._id,
            name: response.data.user.name,
            email: response.data.user.email,
            role: response.data.user.role,
          })
        );
        router.push("/delivery-partner/dashboard");
      } else {
        setErrors((prev) => ({
          ...prev,
          submit: "Invalid response from server",
        }));
      }
    } catch (error: unknown) {
      setErrors((prev) => ({
        ...prev,
        submit:
          error instanceof Error
            ? error.message
            : "Invalid OTP. Please try again.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email || resendDisabled) return;

    setResendLoading(true);
    try {
      await authService.resendDeliveryPartnerOTP(email);
      setResendDisabled(true);
      setCountdown(30); // Disable resend for 30 seconds
      setErrors({});
      setFormData({ otp: "" });
      // Show success message
      setErrors((prev) => ({
        ...prev,
        submit: "A new verification code has been sent to your email",
      }));
    } catch (error: unknown) {
      setErrors((prev) => ({
        ...prev,
        submit: error instanceof Error ? error.message : "Failed to resend OTP",
      }));
    } finally {
      setResendLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = formData.otp.split("");
    newOtp[index] = value;
    setFormData({ otp: newOtp.join("") });
    setErrors((prev) => ({ ...prev, otp: "" }));

    // Move focus to next input if a digit was entered
    if (value && index < 5) {
      const nextInput = document.querySelector(
        `input[name="otp-${index + 1}"]`
      );
      if (nextInput instanceof HTMLInputElement) nextInput.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Handle backspace to move to previous input
    if (e.key === "Backspace" && !formData.otp[index] && index > 0) {
      const prevInput = document.querySelector(
        `input[name="otp-${index - 1}"]`
      );
      if (prevInput instanceof HTMLInputElement) prevInput.focus();
    }
  };

  // Function to create digit input references
  const renderOtpInputs = () => {
    const inputs: JSX.Element[] = [];
    for (let i = 0; i < 6; i++) {
      const value = formData.otp[i] || "";
      inputs.push(
        <input
          key={i}
          type="text"
          maxLength={1}
          value={value}
          onChange={(e) => handleOtpChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          name={`otp-${i}`}
          className="w-12 h-12 text-center text-2xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      );
    }
    return inputs;
  };

  const getStatusClassName = () => {
    if (
      (errors.submit && errors.submit.includes("sent")) ||
      errors.submit?.includes("success")
    ) {
      return "bg-emerald-50 border-emerald-500 text-emerald-700";
    }
    return "bg-red-50 border-red-500 text-red-700";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-8 pt-8 pb-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Verify your email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent a verification code to
            </p>
            <p className="mt-1 text-base font-medium text-gray-900">{email}</p>
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            {/* Hidden input to store the complete OTP */}
            <input
              type="hidden"
              name="otp"
              value={formData.otp}
              onChange={() => {}}
            />

            <div className="flex justify-center space-x-2">
              {renderOtpInputs()}
            </div>

            {errors.otp && (
              <p className="text-red-600 text-sm text-center">{errors.otp}</p>
            )}

            {errors.submit && (
              <div className={`border-l-4 p-4 ${getStatusClassName()}`}>
                <p className="text-sm">{errors.submit}</p>
              </div>
            )}

            <div className="flex flex-col space-y-3">
              <button
                type="submit"
                className="w-full py-3 px-4 flex justify-center items-center bg-emerald-500 hover:bg-emerald-600 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-70"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  "Verify & Continue"
                )}
              </button>

              <button
                type="button"
                className="w-full py-3 px-4 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 text-gray-700 font-medium rounded-lg shadow-sm transition-colors disabled:opacity-70"
                disabled={resendLoading || resendDisabled}
                onClick={handleResendOTP}
              >
                {resendLoading
                  ? "Sending..."
                  : resendDisabled
                  ? `Resend code in ${countdown}s`
                  : "Resend code"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Go back to{" "}
              <Link
                href="/delivery-partner/login"
                className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
              >
                Login
              </Link>
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-8 py-4 text-xs text-gray-500 text-center">
          Didn't receive the code? Check your spam folder or verify your email
          address.
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function DeliveryPartnerVerifyOTP() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      }
    >
      <VerifyOTPContent />
    </Suspense>
  );
}
