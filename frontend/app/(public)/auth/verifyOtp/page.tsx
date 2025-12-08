"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone");
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // ---------------------------------------------------
  // STATES
  // ---------------------------------------------------
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [errors, setErrors] = useState<string>("");

  // ---------------------------------------------------
  // FOCUS FIRST INPUT ON MOUNT
  // ---------------------------------------------------
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // ---------------------------------------------------
  // TIMER COUNTDOWN FOR RESEND
  // ---------------------------------------------------
  useEffect(() => {
    if (!canResend && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }

    if (timer === 0) setCanResend(true);
  }, [timer, canResend]);

  // ---------------------------------------------------
  // INVALID SESSION CHECK
  // ---------------------------------------------------
  useEffect(() => {
    if (!phone) {
      setErrors("Invalid session. Please register again.");
    }
  }, [phone]);

  // ---------------------------------------------------
  // OTP INPUT HANDLERS
  // ---------------------------------------------------
  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);
    const newOtp = ["", "", "", ""];

    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];

    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length - 1, 3)]?.focus();
  };

  // ---------------------------------------------------
  // VERIFY OTP
  // ---------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");

    if (otpValue.length !== 4) {
      setErrors("Please enter all 4 digits.");
      return;
    }

    if (!phone) {
      setErrors("Phone missing. Start registration again.");
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/auth/verifyotp`,
        { identifier: phone, otp: otpValue },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.status === 201) {
        setOtp(["", "", "", ""]);
        // ✅ Store auth session
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        // ✅ ALWAYS redirect to home after OTP
        router.push("/");
      }
    } catch (error: any) {
      const status = error.response?.status;
      const msg = error.response?.data?.error;

      const serverErrors = error.response?.data?.errors;
      if (Array.isArray(serverErrors)) {
        setErrors(serverErrors[0].message);
        return;
      }

      switch (status) {
        case 410:
          setErrors("OTP expired. Please request a new one.");
          break;
        case 401:
          setErrors("Invalid OTP. Try again.");
          break;
        case 500:
          setErrors("Server error. Try again later.");
          break;
        default:
          setErrors(msg || "Something went wrong");
      }
    }
  };

  // ---------------------------------------------------
  // RESEND OTP
  // ---------------------------------------------------
  const handleResend = async () => {
    if (!canResend) return;

    try {
      await axios.post(
        `${API_URL}/auth/resend-otp`,
        { phone },
        { headers: { "Content-Type": "application/json" } }
      );

      setOtp(["", "", "", ""]);
      inputRefs.current[0]?.focus();

      setTimer(60);
      setCanResend(false);
      setErrors("");
    } catch (err: any) {
      if (err.response?.status === 429) {
        setErrors(err.response.data.error);
      } else {
        console.log(err);
        setErrors("Something went wrong! Try again.");
      }
    }
  };

  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------
  return (
    <>
      {errors && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] sm:w-[60%] lg:w-[40%] bg-red-600/60 text-white px-4 py-3 rounded-lg shadow-lg backdrop-blur-lg border border-white/20 z-50">
          {errors}
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50 p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Verify OTP</h2>
            <p className="text-gray-600 mt-2">
              Enter the 4-digit code sent to your phone
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600 outline-none transition"
                />
              ))}
            </div>

            <div className="text-center text-sm">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-cyan-700 underline font-medium"
                >
                  Resend OTP
                </button>
              ) : (
                <p className="text-gray-600">
                  Resend OTP in <span className="font-semibold">{timer}s</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-cyan-600 text-white font-semibold rounded-lg text-lg hover:bg-cyan-700 transition shadow-md"
            >
              Verify & Continue
            </button>
          </form>

          <div className="text-center">
            <Link
              href="/auth/register"
              className="text-sm text-gray-600 hover:text-cyan-700"
            >
              ← Back to Sign Up
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
