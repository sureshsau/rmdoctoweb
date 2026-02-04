"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Phone, EyeOff, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthContext } from "@/state/AuthContext";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";


export default function LoginPage() {
  const router = useRouter();
  const { login, sendForgotPasswordOtp } = useAuthContext();
  const [formData, setFormData] = useState<{
    email?: string,
    phone: string,
    password: string
  }>({
    email: "",
    phone: "",
    password: "",
  });
  const [errors, setErrors] = useState<{
    phone?: string,
    password?: string,
    email?: string,
    all?: string;
  }>({});
  const [showPass, setShowPass] = useState<boolean>(false);

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
    setErrors(prev => ({ ...prev, [e.target.name]: undefined }));
  };
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const { phone, password } = formData;

    // ==========================
    // 1. CLIENT-SIDE VALIDATION
    // ==========================
    if (!phone && !password) {
      setErrors({ all: "Please enter all required details" });
      return;
    }

    if (!phone) {
      setErrors({ phone: "Please enter your phone number" });
      return;
    }
    if (!password) {
      setErrors({ password: "Please enter your password" });
      return;
    }
    if (phone.length !== 10) {
      setErrors({ phone: "Phone number must be exactly 10 digits" });
      return;
    }

    // ==========================
    // 2. SEND DATA TO BACKEND
    // ==========================
    try {
      await login({
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      // clear password after success
      setFormData((prev) => ({ ...prev, password: "" }));

    } catch (error: unknown) {
      // ==========================
      // 3. HANDLE BACKEND ERRORS
      // ==========================
      setErrors({ all: getApiErrorMessage(error, "Network error. Please try again.") });
    }
  };



  // This is for handling forgot password 


  const handleForgotSubmit = async () => {
    if (!forgotValue) {
      setForgotError(`Please enter your ${forgotType}`);
      return;
    }

    setForgotLoader(true);
    setForgotError("");

    try {
      await sendForgotPasswordOtp({ identifier: forgotValue, type: forgotType });
      setShowForgotModal(false);

      // Redirect based on type
      if (forgotType === "email") {
        router.push(`/auth/forgot-verifyOtp?email=${forgotValue}`);
      } else {
        router.push(`/auth/forgot-verifyOtp?phone=${forgotValue}`);
      }
    } catch (err: unknown) {
      setForgotError(getApiErrorMessage(err, "Something went wrong"));
    } finally {
      setForgotLoader(false);
    }
  };



  useEffect(() => {
    if (!errors || Object.keys(errors).length === 0) return;

    const timer = setTimeout(() => {
      setErrors({});
    }, 3000);

    return () => clearTimeout(timer);
  }, [errors]);


  const showPassword = () => {
    setShowPass(!showPass);
  }
  return (
    <>
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
  ">
          {/* Icon */}
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

          {/* Text */}
          <div className="text-left text-sm font-medium leading-tight">
            {errors.all && <p>{errors.all}</p>}
            {!errors.all && errors.phone && <p>{errors.phone}</p>}
            {!errors.all && errors.password && <p>{errors.password}</p>}
            {!errors.all && errors.email && <p>{errors.email}</p>}
          </div>
        </div>

      )}
      <div className="min-h-screen flex items-center justify-center bg-lenear-to-br from-cyan-50 via-blue-50 to-white">
        <div className="max-w-sm w-full p-4 sm:p-6 rounded-xl shadow-2xl bg-white/80 backdrop-blur-lg border border-white/40 space-y-4">

          {/* Title */}
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-gray-900">Sign In</h2>
            <p className="text-gray-600 mt-2">Login to your account</p>
          </div>

          {/* Form */}
          <form noValidate className="mt-4 space-y-4">


            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address (optional)
              </label>
              <div className="relative">
                <Mail className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-cyan-500"
        ${errors.email ? "border-red-500 focus:ring-red-500 outline-none" : "focus:ring-cyan-500 outline-none"}
      `}
                  placeholder="Enter your email"
                />
              </div>

            </div>

            {/* Phone Number */}
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
                  className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-cyan-500"
        ${errors.phone ? " border-red-500 focus:ring-red-500 outline-none" : "focus:ring-cyan-500 outline-none"}
      `}
                  placeholder="Enter your phone number"
                />
              </div>

            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />

                {showPass ? (
                  <Eye onClick={showPassword} className="h-5 w-5 cursor-pointer absolute right-3 top-2.5 text-gray-400" />
                ) : (
                  <EyeOff onClick={showPassword} className="h-5 w-5 cursor-pointer absolute right-3 top-2.5 text-gray-400" />
                )}

                <input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-cyan-500"
        ${errors.password ? " border-red-500 focus:ring-red-500 outline-none" : "focus:ring-cyan-500 outline-none"}
      `}
                  placeholder="Enter a password"
                />
              </div>
            </div>
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sm text-cyan-600 hover:text-cyan-700 hover:underline"
              >
                Forgot Password?
              </button>
            </div>


            {/* Sign Up Button */}
            <button
              type="submit"
              className="w-full py-3 bg-cyan-600 text-white rounded-lg font-semibold text-lg hover:bg-cyan-700 transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-md"
              onClick={handleSubmit}
            >
              Login
            </button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="font-medium text-cyan-600 hover:text-cyan-700"
              >
                Sign In
              </Link>
            </p>
          </form>

          {/* Back */}
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
                className={`px-4 py-2 rounded-lg border ${forgotType === "email"
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-100 text-gray-700"
                  }`}
              >
                Reset via Email
              </button>

              <button
                onClick={() => { setForgotType("phone"); setForgotValue(""); }}
                className={`px-4 py-2 rounded-lg border ${forgotType === "phone"
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

            {/* Submit Button */}
            <button
              onClick={handleForgotSubmit}
              disabled={forgotLoader}
              className="w-full py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-all disabled:opacity-50"
            >
              {forgotLoader ? "Sending..." : "Send OTP"}
            </button>
          </div>
        </div>
      )}


    </>
  );
}