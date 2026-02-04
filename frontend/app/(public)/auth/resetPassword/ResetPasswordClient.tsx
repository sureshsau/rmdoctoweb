"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useAuthContext } from "@/state/AuthContext";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { resetPassword } = useAuthContext();

  const identifier: string = (params.get("identifier") || "").trim();
  const type = params.get("type") as "email" | "phone";

  const [passwords, setPasswords] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  const [errors, setErrors] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { password, confirmPassword } = passwords;

    if (!password || !confirmPassword) {
      setErrors("Please fill all fields");
      return;
    }

    if (password.length < 8) {
      setErrors("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setErrors("Passwords do not match");
      return;
    }

    try {
      await resetPassword({ identifier, type, newPassword: password });
      setSuccess("Password reset successfully!");
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (err: unknown) {
      setErrors(getApiErrorMessage(err, "Something went wrong"));
    }
  };

  useEffect(() => {
    if (!errors) return;
    const timeout = setTimeout(() => setErrors(""), 3000);
    return () => clearTimeout(timeout);
  }, [errors]);

  return (
    <>
      {errors && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow">
          {errors}
        </div>
      )}

      {success && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow">
          {success}
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-cyan-50 to-blue-50 px-4">
        <div className="max-w-sm w-full bg-white rounded-xl p-6 shadow-xl space-y-6">

          <h2 className="text-3xl font-extrabold text-center">Reset Password</h2>
          <p className="text-gray-600 text-center text-sm">
            Enter a new password for your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* New Password */}
            <div>
              <label className="text-sm font-medium">New Password</label>
              <div className="relative">
                <Lock className="h-5 w-5 absolute left-3 top-3 text-gray-400" />

                <input
                  type={showPass1 ? "text" : "password"}
                  value={passwords.password}
                  onChange={(e) =>
                    setPasswords({ ...passwords, password: e.target.value })
                  }
                  className="w-full border rounded-lg mt-1 pl-10 pr-3 py-3"
                  placeholder="Enter new password"
                />

                {showPass1 ? (
                  <Eye
                    className="h-5 w-5 absolute right-3 top-3 cursor-pointer text-gray-400"
                    onClick={() => setShowPass1(false)}
                  />
                ) : (
                  <EyeOff
                    className="h-5 w-5 absolute right-3 top-3 cursor-pointer text-gray-400"
                    onClick={() => setShowPass1(true)}
                  />
                )}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium">Confirm Password</label>
              <div className="relative">
                <Lock className="h-5 w-5 absolute left-3 top-3 text-gray-400" />

                <input
                  type={showPass2 ? "text" : "password"}
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, confirmPassword: e.target.value })
                  }
                  className="w-full border rounded-lg mt-1 pl-10 pr-3 py-3"
                  placeholder="Confirm password"
                />

                {showPass2 ? (
                  <Eye
                    className="h-5 w-5 absolute right-3 top-3 cursor-pointer text-gray-400"
                    onClick={() => setShowPass2(false)}
                  />
                ) : (
                  <EyeOff
                    className="h-5 w-5 absolute right-3 top-3 cursor-pointer text-gray-400"
                    onClick={() => setShowPass2(true)}
                  />
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-cyan-600 text-white rounded-lg font-semibold"
            >
              Update Password
            </button>
          </form>

        </div>
      </div>
    </>
  );
}
