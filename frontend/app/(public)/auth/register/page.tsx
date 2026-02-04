"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck, Mail, Lock, User, Phone, EyeOff, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "@/state/AuthContext";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

  const { register } = useAuthContext();
  const [showOtpSend, setShowOtpSend] = useState<boolean>(false);

  //From data State 
  const [formData, setFormData] = useState<{
    name: string;
    email?: string;
    phone: string;
    password: string;
  }>({
    name: "",
    email: "",
    phone: "",
    password: "",
  });



  // Error Handling state

  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    password?: string;
    email?: string;
    all?: string;
  }>({});


  // Toggling password state 
  const [showPass, setShowPass] = useState<boolean>(false);


  // For Handle Input change 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };



  // Regex for password format validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;




  // for Submition of user credential
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const { name, email, phone, password } = formData;

    // ==========================
    // 1. CLIENT-SIDE VALIDATION
    // ==========================
    if (!name && !phone && !password) {
      setErrors({ all: "Please enter all required details" });
      return;
    }

    if (name.trim() === "") {
      setErrors({ name: "Please enter your name" });
      return;
    }

    if (!email || email.trim() === "") {
      setErrors({ email: "Please enter your email" });
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

    if (!passwordRegex.test(password)) {
      setErrors({
        password:
          "Password must contain uppercase, lowercase, number, special character & at least 8 characters",
      });
      return;
    }

    // ==========================
    // 2. SEND DATA TO BACKEND
    // ==========================
    try {
      const { identifier } = await register({
        name,
        email,
        phone,
        password,
      });

      setErrors({});
      setShowOtpSend(true);
      router.push(`/auth/verifyOtp?phone=${identifier}&redirect=${encodeURIComponent(redirect)}`);
      return;
    } catch (error: unknown) {
      setErrors({ all: getApiErrorMessage(error, "Network error. Please try again.") });
    }
  };




  // Error pop removing from screen after 3s;
  useEffect(() => {
    if (!errors || Object.keys(errors).length === 0) return;

    const timer = setTimeout(() => {
      setErrors({});
    }, 3000);

    return () => clearTimeout(timer);
  }, [errors]);

  const showPassword = () => {
    setShowPass(!showPass);
  };
  return (
    <>
      {showOtpSend && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 w-max max-w-[90%] bg-white/80 backdrop-blur-md border border-gray-200 px-4 py-2.5 rounded-lg shadow-md">
          <MailCheck className="w-5 h-5 text-blue-600" />
          <p className="text-gray-800 text-sm font-medium">
            OTP sent successfully
          </p>
        </div>
      )}
      {errors && Object.values(errors).some(Boolean) && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] sm:w-[80%] md:w-[60%] lg:w-[40%] flex items-start gap-3 bg-red-600/50 text-white  border border-white backdrop-blur-md rounded-xl shadow-xl shadow-red-900/20 px-4 py-3">
          {/* Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M4.93 4.93a10 10 0 1114.14 14.14A10 10 0 014.93 4.93z" />
          </svg>
          {/* Text */}
          <div className="text-left text-sm font-medium leading-tight">
            {errors.all && <p>{errors.all}</p>}
            {!errors.all && errors.name && <p>{errors.name}</p>}
            {!errors.all && errors.phone && <p>{errors.phone}</p>}
            {!errors.all && errors.password && <p>{errors.password}</p>}
            {!errors.all && errors.email && <p>{errors.email}</p>}
          </div>
        </div>
      )}
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-cyan-50 via-blue-50 to-white">
        <div className="max-w-sm w-full p-4 sm:p-6 rounded-xl shadow-2xl bg-white/80 backdrop-blur-lg border border-white/40 space-y-4">
          {/* Title */}
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-gray-900">Sign Up</h2>
            <p className="text-gray-600 mt-2">
              Create your account to get started
            </p>
          </div>

          {/* Form */}
          <form noValidate className="mt-4 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-cyan-500"
                              ${errors.name ? " border-red-500 focus:ring-red-500 outline-none" : "focus:ring-cyan-500 outline-none"}`} placeholder="Enter your full name" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
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
        ${errors.email
                      ? "border-red-500 focus:ring-red-500 outline-none"
                      : "focus:ring-cyan-500 outline-none"
                    }
      `}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="text-sm font-medium text-gray-700"
              >
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
        ${errors.phone
                      ? " border-red-500 focus:ring-red-500 outline-none"
                      : "focus:ring-cyan-500 outline-none"
                    }
      `}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />

                {showPass ? (
                  <Eye
                    onClick={showPassword}
                    className="h-5 w-5 cursor-pointer absolute right-3 top-2.5 text-gray-400"
                  />
                ) : (
                  <EyeOff
                    onClick={showPassword}
                    className="h-5 w-5 cursor-pointer absolute right-3 top-2.5 text-gray-400"
                  />
                )}

                <input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-cyan-500"
        ${errors.password
                      ? " border-red-500 focus:ring-red-500 outline-none"
                      : "focus:ring-cyan-500 outline-none"
                    }
      `}
                  placeholder="Create a password"
                />
              </div>
            </div>
            {/* Terms & Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="h-4 w-4 text-cyan-600 rounded mt-1"
              />
              <label className="ml-2 text-sm text-gray-700">
                I agree to the{" "}
                <Link
                  href="#"
                  className="text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  Terms and Conditions
                </Link>
              </label>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              className="w-full py-3 bg-cyan-600 text-white rounded-lg font-semibold text-lg hover:bg-cyan-700 transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-md"
              onClick={handleSubmit}
            >
              Create Account
            </button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/login"
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
    </>
  );
}
