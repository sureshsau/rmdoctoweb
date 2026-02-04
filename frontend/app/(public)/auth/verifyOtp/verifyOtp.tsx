"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuthContext } from "@/state/AuthContext";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export default function VerifyOTPPage() {
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone");
  const { verifyRegisterOtp } = useAuthContext();

  // ---------------------------------------------------
  // STATES
  // ---------------------------------------------------
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [timer, setTimer] = useState(60);
  const canResend = timer === 0;

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
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(interval);
  }, [timer]);

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

    const redirect = searchParams.get("redirect") || "";

    try {
      await verifyRegisterOtp({ identifier: phone, otp: otpValue }, redirect);
      setOtp(["", "", "", ""]);
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data: unknown = error.response?.data;

        if (isRecord(data) && Array.isArray(data.errors) && data.errors.length > 0 && isRecord(data.errors[0])) {
          const first = data.errors[0].message;
          if (typeof first === "string" && first.trim()) {
            setErrors(first);
            return;
          }
        }

        switch (status) {
          case 410:
            setErrors("OTP expired. Please request a new one.");
            return;
          case 401:
            setErrors("Invalid OTP. Try again.");
            return;
          case 500:
            setErrors("Server error. Try again later.");
            return;
          default:
            break;
        }
      }

      setErrors(msg || "Something went wrong");
    }
  };

  // ---------------------------------------------------
  // RESEND OTP
  // ---------------------------------------------------
  const handleResend = async () => {
    if (!canResend) return;

    try {
      // backend expects { identifier }
      const { authService } = await import("@/services/auth.service");
      await authService.resendOtp(phone as string);

      setOtp(["", "", "", ""]);
      inputRefs.current[0]?.focus();

      setTimer(60);
      setErrors("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        setErrors(getApiErrorMessage(err));
        return;
      }
      setErrors(getApiErrorMessage(err, "Something went wrong! Try again."));
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

      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-cyan-50 to-blue-50 p-4">
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
