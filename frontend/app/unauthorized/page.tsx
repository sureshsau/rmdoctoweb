"use client";

import Link from "next/link";
import { useAuthContext } from "@/state/AuthContext";
import { getDashboardPathForUser } from "@/lib/roleRoutes";

export default function UnauthorizedPage() {
  const { user } = useAuthContext();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-white p-6">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl p-8 text-center space-y-4">
        <h1 className="text-3xl font-extrabold text-gray-900">Unauthorized</h1>
        <p className="text-gray-600">
          You don’t have access to this page.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href={getDashboardPathForUser(user)}
            className="px-5 py-2.5 rounded-full bg-cyan-600 text-white font-semibold hover:bg-cyan-700 transition"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-full bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
