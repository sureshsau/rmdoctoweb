"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Phone, ArrowLeft, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthContext } from "@/state/AuthContext";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

// You need to import this service or define it
// import { sendForgotPasswordOtp } from "@/services/auth.service";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "";

  const { login, verifyRegisterOtp } = useAuthContext();
  
  // Step management: "phone" or "otp"
  const [step, setStep] = useState<"phone" | "otp">("phone");
  
  // Form data
  const [formData, setFormData] = useState<{
    phone: string;
    otp: string;
  }>({
    phone: "",
    otp: "",
  });
  
  // UI states
  const [errors, setErrors] = useState<{
    phone?: string;
    otp?: string;
    all?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Forgot Password handler 
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotLoader, setForgotLoader] = useState(false);
  const [forgotType, setForgotType] = useState<"email" | "phone">("email");
  const [forgotValue, setForgotValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrors(prev => ({ ...prev, [e.target.name]: undefined, all: undefined }));
  };

  // Handle sending OTP
  const handleSendOtp = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const { phone } = formData;

    // Validate phone
    if (!phone) {
      setErrors({ phone: "Please enter your phone number" });
      return;
    }
    if (phone.length !== 10) {
      setErrors({ phone: "Phone number must be exactly 10 digits" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Send OTP to phone
      await login({ phone }, redirectTo);
      
      // Move to OTP step
      setStep("otp");
      // Start resend timer (60 seconds)
      setResendTimer(30);
    } catch (error: unknown) {
      setErrors({ all: getApiErrorMessage(error, "Failed to send OTP. Please try again.") });
    } finally {
      setLoading(false);
    }
  };

  // Handle verifying OTP
  const handleVerifyOtp = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const { phone, otp } = formData;

    // Validate OTP
    if (!otp) {
      setErrors({ otp: "Please enter the OTP" });
      return;
    }
    if (otp.length !== 6) {
      setErrors({ otp: "OTP must be 6 digits" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Verify OTP and login
      await verifyRegisterOtp({ phone, otp }, redirectTo);
      
      // Clear form on success
      setFormData({ phone: "", otp: "" });
    } catch (error: unknown) {
      setErrors({ all: getApiErrorMessage(error, "Invalid OTP. Please try again.") });
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    setErrors({});

    try {
      await login({ phone: formData.phone }, redirectTo);
      setResendTimer(30);
    } catch (error: unknown) {
      setErrors({ all: getApiErrorMessage(error, "Failed to resend OTP") });
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password submit
  // const handleForgotSubmit = async () => {
  //   if (!forgotValue) {
  //     setForgotError(`Please enter your ${forgotType}`);
  //     return;
  //   }

  //   // Validate phone number if type is phone
  //   if (forgotType === "phone" && forgotValue.length !== 10) {
  //     setForgotError("Phone number must be exactly 10 digits");
  //     return;
  //   }

  //   // Validate email if type is email
  //   if (forgotType === "email" && !forgotValue.includes('@')) {
  //     setForgotError("Please enter a valid email address");
  //     return;
  //   }

  //   setForgotLoader(true);
  //   setForgotError("");

  //   try {
  //     // You need to implement this service or import it
  //     // await sendForgotPasswordOtp({ identifier: forgotValue, type: forgotType });
      
  //     // For now, let's simulate the API call
  //     console.log("Sending forgot password OTP to:", forgotValue, "type:", forgotType);
      
  //     // Simulate API delay
  //     await new Promise(resolve => setTimeout(resolve, 1000));
      
  //     setShowForgotModal(false);

  //     // Redirect based on type
  //     if (forgotType === "email") {
  //       router.push(`/auth/forgot-verifyOtp?email=${encodeURIComponent(forgotValue)}`);
  //     } else {
  //       router.push(`/auth/forgot-verifyOtp?phone=${encodeURIComponent(forgotValue)}`);
  //     }
  //   } catch (err: unknown) {
  //     setForgotError(getApiErrorMessage(err, "Something went wrong"));
  //   } finally {
  //     setForgotLoader(false);
  //   }
  // };

  // Go back to phone step
  const handleBackToPhone = () => {
    setStep("phone");
    setFormData(prev => ({ ...prev, otp: "" }));
    setErrors({});
  };

  // Timer for resend OTP
  useEffect(() => {
    if (resendTimer <= 0) return;

    const timer = setInterval(() => {
      setResendTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimer]);

  // Auto-clear errors after 3 seconds
  useEffect(() => {
    if (!errors || Object.keys(errors).length === 0) return;

    const timer = setTimeout(() => {
      setErrors({});
    }, 3000);

    return () => clearTimeout(timer);
  }, [errors]);

  return (
    <>
      {/* Error Toast */}
      {errors && Object.values(errors).some(Boolean) && (
        <div
          className="
            fixed top-6 left-1/2 transform -translate-x-1/2 
            z-50 w-[90%] sm:w-[80%] md:w-[60%] lg:w-[40%]
            flex items-start gap-3
            bg-red-600/50 text-white 
            border border-white backdrop-blur-md
            rounded-xl shadow-xl shadow-red-900/20
            px-4 py-3
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M4.93 4.93a10 10 0 1114.14 
                14.14A10 10 0 014.93 4.93z"
            />
          </svg>

          <div className="text-left text-sm font-medium leading-tight">
            {errors.all && <p>{errors.all}</p>}
            {!errors.all && errors.phone && <p>{errors.phone}</p>}
            {!errors.all && errors.otp && <p>{errors.otp}</p>}
          </div>
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-white">
        <div className="max-w-sm w-full p-4 sm:p-6 rounded-xl shadow-2xl bg-white/80 backdrop-blur-lg border border-white/40 space-y-4">

          {/* Title */}
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-gray-900">
              {step === "phone" ? "Sign In" : "Verify OTP"}
            </h2>
            <p className="text-gray-600 mt-2">
              {step === "phone" 
                ? "Enter your phone number to receive OTP" 
                : `Enter the 6-digit OTP sent to ${formData.phone}`
              }
            </p>
          </div>

          {/* Form */}
          <form noValidate className="mt-4 space-y-4">

            {step === "phone" ? (
              /* Phone Number Step */
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-3 py-3 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 outline-none ${
                      errors.phone 
                        ? "border-red-500 focus:ring-red-500" 
                        : "border-gray-300 focus:ring-cyan-500"
                    }`}
                    placeholder="Enter your phone number"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  You'll receive a 6-digit OTP via SMS
                </p>
              </div>
            ) : (
              /* OTP Step */
              <div className="space-y-4">
                {/* Back button */}
                <button
                  type="button"
                  onClick={handleBackToPhone}
                  className="flex items-center text-sm text-gray-600 hover:text-cyan-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Change phone number
                </button>

                {/* OTP Input */}
                <div className="space-y-2">
                  <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                    Enter OTP
                  </label>
                  <div className="relative">
                    <CheckCircle className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      required
                      value={formData.otp}
                      onChange={handleChange}
                      maxLength={6}
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 outline-none ${
                        errors.otp 
                          ? "border-red-500 focus:ring-red-500" 
                          : "border-gray-300 focus:ring-cyan-500"
                      }`}
                      placeholder="Enter 6-digit OTP"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Resend OTP */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || loading}
                    className="text-sm text-cyan-600 hover:text-cyan-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {resendTimer > 0 
                      ? `Resend OTP in ${resendTimer}s` 
                      : "Resend OTP"
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              onClick={step === "phone" ? handleSendOtp : handleVerifyOtp}
              disabled={loading}
              className="w-full py-3 bg-cyan-600 text-white rounded-lg font-semibold text-lg hover:bg-cyan-700 transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? (step === "phone" ? "Sending OTP..." : "Verifying...") 
                : (step === "phone" ? "Send OTP" : "Verify & Login")
              }
            </button>

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

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[90%] sm:w-[400px] space-y-4 relative">

            {/* Close Button */}
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>

            <h2 className="text-xl font-bold text-gray-900 text-center">
              Reset Password
            </h2>

            {/* Toggle Buttons */}
            <div className="flex justify-center gap-3 mt-3">
              <button
                onClick={() => { setForgotType("email"); setForgotValue(""); }}
                className={`px-4 py-2 rounded-lg border ${
                  forgotType === "email"
                    ? "bg-cyan-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Reset via Email
              </button>

              <button
                onClick={() => { setForgotType("phone"); setForgotValue(""); }}
                className={`px-4 py-2 rounded-lg border ${
                  forgotType === "phone"
                    ? "bg-cyan-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Reset via Phone
              </button>
            </div>

            {/* Dynamic Input */}
            <div className="relative mt-3">
              {forgotType === "email" ? (
                <Mail className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
              ) : (
                <Phone className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
              )}

              <input
                type={forgotType === "email" ? "email" : "tel"}
                value={forgotValue}
                onChange={(e) => setForgotValue(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                placeholder={
                  forgotType === "email"
                    ? "Enter your email"
                    : "Enter your phone number"
                }
              />
            </div>

            {/* Validation Error */}
            {forgotError && (
              <p className="text-red-600 text-sm text-center">{forgotError}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}