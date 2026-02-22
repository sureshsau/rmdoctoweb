"use client";

import { useMedicineCart } from "@/context/MedicineCartContext";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/state/AuthContext";

export default function CartPage() {
    const { items, totalPrice, updateQuantity, removeMedicine } = useMedicineCart();
    const { user } = useAuthContext();
    const router = useRouter();

    // Helper to get correct price per item based on user role
    const getPrice = (item: any) => {
        const isAgent = user?.roles?.some((r) => r.toLowerCase().includes("agent")) ?? false;
        return isAgent
            ? (item.pricing?.specialPrice ?? item.pricing?.price ?? 0)
            : (item.pricing?.price ?? 0);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white px-4 py-3 flex items-center gap-4 border-b border-gray-100 sticky top-0 z-20">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="font-bold text-gray-800 flex-1">My Cart</h1>
                <div className="bg-cyan-50 text-cyan-700 px-3 py-1 rounded-full text-xs font-bold">
                    {items.length} Items
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4 space-y-4">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="bg-gray-100 p-6 rounded-full">
                            <ShoppingBag className="w-12 h-12 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Your cart is empty</h2>
                        <Link href="/dashboard/medicine" className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-medium">
                            Browse Medicines
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {items.map(item => {
                                const price = getPrice(item);
                                return (
                                    <div key={item._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                                        <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                            {item.images && item.images.length > 0 ? (
                                                <img src={item.images[0].url} className="w-16 h-16 object-contain mix-blend-multiply" />
                                            ) : (
                                                <ShoppingBag className="w-8 h-8 text-gray-300" />
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                                                <p className="text-sm text-gray-500">{item.brandName}</p>
                                            </div>
                                            <div className="flex justify-between items-end mt-2">
                                                <span className="text-lg font-bold text-cyan-700">₹{price * item.quantity}</span>

                                                <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                                                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="p-1 hover:bg-white rounded transition"><Minus className="w-4 h-4 text-gray-600" /></button>
                                                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="p-1 hover:bg-white rounded transition"><Plus className="w-4 h-4 text-gray-600" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Bill Summary */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-3">
                            <h3 className="font-bold text-gray-800 mb-2">Price Details</h3>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-medium">₹{totalPrice}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Delivery Fee</span>
                                <span className="font-medium text-green-600">Free</span>
                            </div>
                            <div className="border-t border-dashed border-gray-200 my-2 pt-2 flex justify-between text-lg font-bold">
                                <span>Total Amount</span>
                                <span>₹{totalPrice}</span>
                            </div>

                            <button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-200 mt-4">
                                Proceed to Checkout
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
