"use client";

import { Medicine } from "@/services/medicine.service";
import { useMedicineCart } from "@/context/MedicineCartContext";
import { useAuthContext } from "@/state/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { Pill, Trash2, Plus, Minus } from "lucide-react";

export default function MedicineCard({ medicine }: { medicine: Medicine }) {
    const { user } = useAuthContext();
    const { items, addMedicine, updateQuantity } = useMedicineCart();

    // Role Logic
    console.log(medicine.pricing);
    const isAgent: boolean = user?.roles?.some((r) => r.toLowerCase().includes("agent") || r.toLowerCase().includes("admin")) ?? false;

    // Data Extraction
    // User logic: "Everyone sees MRP". "Agent sees Special Price also".
    // Pricing Logic with fallback to legacy flat fields
    const mrp = medicine.pricing?.mrp ?? (medicine as any).mrp ?? 0;
    const price = medicine.pricing?.price ?? (medicine as any).price ?? mrp; // Public Selling Price
    const specialPrice = medicine.pricing?.specialPrice ?? (medicine as any).specialPrice ?? 0; // Agent Selling Price

    // Discount (based on MRP vs Selling Price)
    const effectivePrice = (isAgent && specialPrice > 0) ? specialPrice : price;
    // const discount = (mrp > effectivePrice && mrp > 0)
    //     ? Math.round(((mrp - effectivePrice) / mrp) * 100)
    //     : 0;

    // Image handling
    const imageUrl = (() => {
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
        const rawSource = (medicine as any).image || (medicine.images && medicine.images[0]);
        if (!rawSource) return null;
        const raw = (rawSource as any).url ?? (rawSource as any).path ?? (rawSource as any).location ?? (rawSource as any).src ?? rawSource;
        if (!raw || typeof raw !== "string") return null;
        if (raw.startsWith("http")) return raw;
        const normalized = raw.startsWith("/") ? raw : `/${raw}`;
        return `${apiBase}${normalized}`;
    })();

    // Cart State
    const cartItem = items.find((i) => i._id === medicine._id);

    // Stock Logic (Ignored per user request)
    const isOutOfStock = false; // (medicine.stock?.totalQuantity || 0) <= 0;

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition duration-300 relative flex flex-col h-full ${isOutOfStock ? 'opacity-70' : ''}`}>
            {/* Clickable Area for Details */}
            <Link href={`/medicine-store/${medicine._id}`} className="block relative">
                <div className="h-48 bg-gray-50 relative flex items-center justify-center p-4">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={medicine.name}
                            className={`max-h-full max-w-full object-contain mix-blend-multiply transition-transform ${!isOutOfStock && 'group-hover:scale-105'} ${isOutOfStock ? 'grayscale' : ''}`}
                        />
                    ) : (
                        <Pill className="w-16 h-16 text-gray-300" />
                    )}



                    {/* {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                            <span className="bg-red-100 text-red-600 px-3 py-1 font-bold rounded-lg text-sm border border-red-200">
                                OUT OF STOCK
                            </span>
                        </div>
                    )} */}
                </div>

                <div className="p-4 pb-0">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-gray-900 group-hover:text-cyan-700 transition truncate pr-2" title={medicine.name}>
                            {medicine.name}
                        </h3>
                        {medicine.dosageForm && (
                            <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded font-medium shrink-0 uppercase tracking-wide">
                                {medicine.dosageForm}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-3">{medicine.manufacturer?.name || medicine.brandName || "Generic"}</p>
                </div>
            </Link>

            <div className="p-4 pt-2 mt-auto">
                <div className="flex flex-col mb-4 min-h-[50px] justify-end">
                    <div className="flex flex-col">
                        {/* MRP Strikethrough */}
                        <span className="text-xs text-gray-400 line-through">MRP ₹{mrp}</span>

                        <div className="flex items-baseline gap-2">
                            {/* Public Price (Hidden for Agents if they have Special Price) */}
                            {(!isAgent) && (
                                <span className="text-lg font-bold text-gray-900">
                                    ₹{price}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Agent Price Highlight */}
                    {isAgent && (
                        <div className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded inline-block w-fit mt-1 border border-green-100">
                            Agent Price: ₹{specialPrice}
                        </div>
                    )}
                </div>

                {/* Add / Qty Control */}
                {!cartItem ? (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            if (!isOutOfStock) addMedicine(medicine);
                        }}
                        disabled={isOutOfStock}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2"
                    >
                        {isOutOfStock ? "NO STOCK" : <><Plus className="w-4 h-4" /> ADD</>}
                    </button>
                ) : (
                    <div className="flex items-center justify-between bg-orange-500 rounded-xl overflow-hidden h-10 px-1">
                        <button
                            onClick={() => updateQuantity(medicine._id, cartItem.quantity - 1)}
                            className="w-10 h-full flex items-center justify-center text-white hover:bg-orange-600 transition"
                        >
                            <Minus className="w-4 h-4" />
                        </button>

                        <span className="text-white font-bold text-sm">{cartItem.quantity}</span>

                        <button
                            onClick={() => updateQuantity(medicine._id, cartItem.quantity + 1)}
                            className="w-10 h-full flex items-center justify-center text-white hover:bg-orange-600 transition"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
