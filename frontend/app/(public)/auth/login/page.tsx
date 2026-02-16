"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Phone, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthContext } from "@/state/AuthContext";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "";

  const { login, verifyRegisterOtp } = useAuthContext();
  
  // Step management
  const [step, setStep] = useState<"phone" | "otp">("phone");
  
  // Form states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  
  // UI states
  const [errors, setErrors] = useState<{
    phone?: string;
    otp?: string;
    all?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Handle phone submission - Request OTP
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!phoneNumber) {
      setErrors({ phone: "Please enter your phone number" });
      return;
    }
    if (phoneNumber.length !== 10) {
      setErrors({ phone: "Phone number must be exactly 10 digits" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Call login/send-otp API
      await login({ phone: phoneNumber }, redirectTo);
      setStep("otp");
      startResendTimer();
    } catch (error: unknown) {
      setErrors({ all: getApiErrorMessage(error, "Failed to send OTP. Please try again.") });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp) {
      setErrors({ otp: "Please enter the OTP" });
      return;
    }
    if (otp.length !== 6) {
      setErrors({ otp: "OTP must be 6 digits" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Call login/verify-otp API
      // Note: Using verifyRegisterOtp from context as it matches the verify-otp endpoint
      await verifyRegisterOtp({ 
        identifier: phoneNumber, 
        otp: otp 
      }, redirectTo);
      // Redirect happens automatically from the auth context
    } catch (error: unknown) {
      setErrors({ all: getApiErrorMessage(error, "Invalid OTP. Please try again.") });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    setErrors({});

    try {
      await login({ phone: phoneNumber }, redirectTo);
      startResendTimer();
    } catch (error: unknown) {
      setErrors({ all: getApiErrorMessage(error, "Failed to resend OTP") });
    } finally {
      setIsLoading(false);
    }
  };

  // Start resend timer
  const startResendTimer = () => {
    setResendTimer(30);
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Auto-clear errors
  useEffect(() => {
    if (!errors || Object.keys(errors).length === 0) return;

    const timer = setTimeout(() => {
      setErrors({});
    }, 3000);

    return () => clearTimeout(timer);
  }, [errors]);

  // Back to phone step
  const handleBackToPhone = () => {
    setStep("phone");
    setOtp("");
    setErrors({});
  };

  return (
    <>
      {/* Error Toast */}
      {errors.all && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] sm:w-[80%] md:w-[60%] lg:w-[40%] flex items-start gap-3 bg-red-600/50 text-white border border-white backdrop-blur-md rounded-xl shadow-xl shadow-red-900/20 px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M4.93 4.93a10 10 0 1114.14 14.14A10 10 0 014.93 4.93z" />
          </svg>
          <div className="text-left text-sm font-medium leading-tight">
            <p>{errors.all}</p>
          </div>
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-white">
        <div className="max-w-sm w-full p-4 sm:p-6 rounded-xl shadow-2xl bg-white/80 backdrop-blur-lg border border-white/40 space-y-4">
          
          {/* Back button (only on OTP step) */}
          {step === "otp" && (
            <button
              onClick={handleBackToPhone}
              className="flex items-center text-gray-600 hover:text-cyan-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="text-sm">Back</span>
            </button>
          )}

          {/* Title */}
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-gray-900">
              {step === "phone" ? "Sign In" : "Verify OTP"}
            </h2>
            <p className="text-gray-600 mt-2">
              {step === "phone" 
                ? "Enter your phone number to continue" 
                : `Enter the 6-digit code sent to ${phoneNumber}`
              }
            </p>
          </div>

          {/* Form */}
          <form noValidate className="mt-4 space-y-4" onSubmit={step === "phone" ? handlePhoneSubmit : handleOtpSubmit}>
            {step === "phone" ? (
              /* Phone Number Input */
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                      setErrors((prev) => ({ ...prev, phone: undefined, all: undefined }));
                    }}
                    className={`w-full pl-10 pr-3 py-3 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 outline-none transition-all
                      ${errors.phone 
                        ? "border-red-500 focus:ring-red-500" 
                        : "border-gray-300 focus:ring-cyan-500"
                      }
                    `}
                    placeholder="Enter 10-digit phone number"
                    disabled={isLoading}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                )}
              </div>
            ) : (
              /* OTP Input */
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                  Enter OTP
                </label>
                <div className="relative">
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setErrors((prev) => ({ ...prev, otp: undefined, all: undefined }));
                    }}
                    className={`w-full px-4 py-3 border rounded-lg text-gray-900 placeholder:text-gray-400 text-center text-2xl tracking-widest font-mono focus:ring-2 outline-none transition-all
                      ${errors.otp 
                        ? "border-red-500 focus:ring-red-500" 
                        : "border-gray-300 focus:ring-cyan-500"
                      }
                    `}
                    placeholder="••••••"
                    maxLength={6}
                    disabled={isLoading}
                  />
                </div>
                {errors.otp && (
                  <p className="text-sm text-red-600 mt-1">{errors.otp}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-cyan-600 text-white rounded-lg font-semibold text-lg hover:bg-cyan-700 transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {step === "phone" ? "Sending OTP..." : "Verifying..."}
                </>
              ) : (
                <>
                  {step === "phone" ? "Send OTP" : "Verify & Login"}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            {/* Resend OTP option */}
            {step === "otp" && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || isLoading}
                  className="text-sm text-cyan-600 hover:text-cyan-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {resendTimer > 0 
                    ? `Resend OTP in ${resendTimer}s` 
                    : "Resend OTP"
                  }
                </button>
              </div>
            )}

            {/* Register Link */}
            {step === "phone" && (
              <p className="text-center text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/register"
                  className="font-medium text-cyan-600 hover:text-cyan-700"
                >
                  Sign Up
                </Link>
              </p>
            )}
          </form>

          {/* Back to Home */}
          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-cyan-600"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}