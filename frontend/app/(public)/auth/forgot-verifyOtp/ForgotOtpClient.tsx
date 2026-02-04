"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuthContext } from "@/state/AuthContext";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export default function ForgotVerifyOtpPage() {
  const router = useRouter();
  const { sendForgotPasswordOtp, verifyForgotPasswordOtp } = useAuthContext();

  const params = useSearchParams();
  const email = params.get("email");
  const phone = params.get("phone");

  const identifier: string = (email || phone || "").trim(); // NEVER null
  const type: "email" | "phone" = email ? "email" : "phone";

  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [errors, setErrors] = useState<string>("");

  const [timer, setTimer] = useState<number>(60);
  const canResend = timer === 0;

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (!errors) return;
    const timeout = setTimeout(() => setErrors(""), 3000);
    return () => clearTimeout(timeout);
  }, [errors]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (i: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const arr = [...otp];
    arr[i] = value;
    setOtp(arr);

    if (value && i < 3) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").slice(0, 4);

    if (!/^\d+$/.test(text)) return;

    const arr = ["", "", "", ""];
    for (let i = 0; i < text.length; i++) arr[i] = text[i];

    setOtp(arr);
    inputRefs.current[Math.min(text.length - 1, 3)]?.focus();
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      await sendForgotPasswordOtp({ identifier, type });

      setOtp(["", "", "", ""]);
      setTimer(60);
    } catch (err: unknown) {
      setErrors(getApiErrorMessage(err, "Failed to resend OTP"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = otp.join("");

    if (code.length !== 4) {
      setErrors("Please enter all 4 digits");
      return;
    }

    try {
      await verifyForgotPasswordOtp({ identifier, type, otp: code });
      router.push(`/auth/resetPassword?identifier=${identifier}&type=${type}`);
    } catch (err: unknown) {
      setErrors(getApiErrorMessage(err, "Invalid OTP"));
    }
  };

  return (
    <>
      {errors && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow">
          {errors}
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-cyan-50 to-blue-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl p-8 shadow-xl">

          <h2 className="text-3xl font-bold text-center">Verify OTP</h2>
          <p className="text-center text-gray-600 mt-2">
            Enter the OTP sent to your {type}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="flex justify-center gap-3">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) =>{inputRefs.current[i] = el}}
                  maxLength={1}
                  type="text"
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  inputMode="numeric"
                  className="w-12 h-12 border rounded-lg text-center text-xl"
                />
              ))}
            </div>

            <div className="text-center text-sm text-gray-600">
              {canResend ? (
                <button onClick={handleResend} type="button" className="text-cyan-600 font-medium">
                  Resend OTP
                </button>
              ) : (
                <>Resend available in {timer}s</>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-cyan-600 text-white rounded-lg font-semibold"
            >
              Verify OTP
            </button>
          </form>

          <div className="text-center mt-4">
            <Link href="/auth/login" className="text-gray-600 text-sm">
              ← Back to Login
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
