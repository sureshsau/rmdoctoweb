"use client";

import { useAuthContext } from "@/state/AuthContext";

export default function ReceptionDashboard() {
  const { user, logout } = useAuthContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Reception Dashboard</h1>
            <p className="text-gray-600 text-sm">Welcome, {user?.name}</p>
          </div>
          <button
            onClick={() => logout({ redirectTo: "/" })}
            className="px-4 py-2 rounded-full bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
