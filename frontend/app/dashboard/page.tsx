"use client";

import { useAuthContext } from "@/state/AuthContext";
import { LogOut, ShoppingBag, Pill, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMedicineCart } from "@/context/MedicineCartContext"; // Use cart for badge

export default function UserDashboard() {
  const { user, logout } = useAuthContext();
  const { totalItems } = useMedicineCart();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-teal-100 text-teal-700 p-2.5 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">RMDOCTO</h1>
            <p className="text-xs text-gray-500">Welcome, {user?.name}</p>
          </div>
        </div>
        <button
          onClick={() => logout({ redirectTo: "/auth/login" })}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </nav>

      <main className="max-w-5xl mx-auto p-6 flex-1 w-full space-y-8">

        {/* Hero Section */}
        <section className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-teal-100">
          <div className="relative z-10 max-w-lg">
            <h2 className="text-3xl font-bold mb-4">Your Health, Delivered.</h2>
            <p className="text-teal-100 mb-8 text-lg">
              Browse our complete pharmacy catalog, compare prices, and order medicines directly from your dashboard.
            </p>
            <Link
              href="/medicine-store"
              className="bg-white text-teal-700 px-8 py-3 rounded-xl font-bold hover:bg-teal-50 transition inline-flex items-center gap-2 shadow-lg"
            >
              <ShoppingBag className="w-5 h-5" />
              Enter Medicine Store
            </Link>
          </div>

          {/* Decorative Background Icon */}
          <Pill className="absolute -bottom-10 -right-10 w-64 h-64 text-white opacity-10 rotate-12 pointer-events-none" />
        </section>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Store Card */}
          <Link href="/medicine-store" className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-teal-100 transition flex items-center gap-4">
            <div className="bg-green-100 text-green-600 p-4 rounded-full group-hover:scale-110 transition">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-600 transition">Buy Medicines</h3>
              <p className="text-sm text-gray-500">Full catalog with live stock</p>
            </div>
            <ArrowRight className="text-gray-300 group-hover:text-green-600 transition" />
          </Link>

          {/* Cart Card */}
          <Link href="/medicine-store/cart" className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-teal-100 transition flex items-center gap-4">
            <div className="bg-orange-100 text-orange-600 p-4 rounded-full group-hover:scale-110 transition relative">
              <ShoppingBag className="w-8 h-8" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
                  {totalItems}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 group-hover:text-orange-600 transition">My Cart</h3>
              <p className="text-sm text-gray-500">{totalItems} items selected</p>
            </div>
            <ArrowRight className="text-gray-300 group-hover:text-orange-600 transition" />
          </Link>

        </div>

      </main>

      <footer className="text-center py-6 text-gray-400 text-sm">
        © 2026 RMDOCTO. All rights reserved.
      </footer>
    </div>
  );
}
