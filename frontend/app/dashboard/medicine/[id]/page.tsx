"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { medicineService, Medicine } from "@/services/medicine.service";
import { useMedicineCart } from "@/context/MedicineCartContext";
import { useAuthContext } from "@/state/AuthContext";
import { ArrowLeft, Minus, Plus, ShoppingBag, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function MedicineDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [medicine, setMedicine] = useState<Medicine | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);

    const { items, addMedicine, updateQuantity } = useMedicineCart();
    const { user } = useAuthContext();

    useEffect(() => {
        if (id) fetchMedicine(id as string);
    }, [id]);

    async function fetchMedicine(medId: string) {
        try {
            const data = await medicineService.getMedicineById(medId);
            if (data) {
                setMedicine(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!medicine) return <div className="min-h-screen flex items-center justify-center">Medicine not found</div>;

    // Role Logic
    const isAgent = user?.roles?.some((r) => r.toLowerCase().includes("agent")) ?? false;
    const price = isAgent
        ? (medicine.pricing?.specialPrice ?? medicine.pricing?.price ?? 0)
        : (medicine.pricing?.price ?? 0);
    const mrp = medicine.pricing?.mrp ?? 0;

    const cartItem = items.find(i => i._id === medicine._id);
    const lowStock = (medicine.stock?.totalQuantity || 0) <= (medicine.stock?.minAlertQuantity || 10);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Nav */}
            <div className="bg-white px-4 py-3 flex items-center gap-4 border-b border-gray-100 sticky top-0 z-20">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="font-bold text-gray-800 truncate flex-1">{medicine.name}</h1>
            </div>

            <div className="max-w-4xl mx-auto p-4 space-y-6">

                {/* Image Display */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl mb-4 overflow-hidden relative">
                        {medicine.images && medicine.images.length > 0 ? (
                            <img
                                src={medicine.images[activeImage].url}
                                className="max-h-full max-w-full object-contain mix-blend-multiply"
                            />
                        ) : (
                            <div className="text-gray-300">No Image</div>
                        )}

                        {/* Dots */}
                        <div className="absolute bottom-2 flex gap-1.5">
                            {medicine.images?.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full transition-all ${activeImage === idx ? 'bg-cyan-600 w-4' : 'bg-gray-300'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Thumbnails */}
                    {medicine.images && medicine.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {medicine.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(idx)}
                                    className={`w-16 h-16 border rounded-lg p-1 ${activeImage === idx ? 'border-cyan-500' : 'border-gray-200'}`}
                                >
                                    <img src={img.url} className="w-full h-full object-contain" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Basic Info */}
                <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 leading-tight">{medicine.name}</h2>
                        <p className="text-gray-500 text-sm mt-1">{medicine.brandName} • {medicine.manufacturer?.name}</p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {medicine.dosageForm && <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{medicine.dosageForm}</span>}
                        {medicine.prescriptionType && <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">{medicine.prescriptionType}</span>}
                        {lowStock && <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> LOW STOCK</span>}
                    </div>

                    <div className="flex items-end gap-3 pt-2">
                        <span className="text-3xl font-bold text-cyan-700">₹{price}</span>
                        {mrp > price && (
                            <>
                                <span className="text-gray-400 line-through mb-1.5">₹{mrp}</span>
                                <span className="text-green-600 font-bold mb-1.5 text-sm">
                                    {Math.round(((mrp - price) / mrp) * 100)}% OFF
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Composition */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4">Composition</h3>
                    <div className="space-y-3">
                        {medicine.composition?.map((comp, idx) => (
                            <div key={idx} className="flex justify-between border-b border-gray-50 pb-2 last:border-0">
                                <span className="text-gray-600">{comp.ingredient}</span>
                                <span className="font-medium">{comp.strength}</span>
                            </div>
                        ))}
                        {(!medicine.composition || medicine.composition.length === 0) && <p className="text-gray-400 text-sm">No composition data.</p>}
                    </div>
                </div>

                {/* Details */}
                <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-800">Clinical Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-gray-500 text-xs mb-1">Therapeutic Use</p>
                            <p className="font-medium text-gray-800">{medicine.therapeuticUse || "-"}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-gray-500 text-xs mb-1">Description</p>
                            <p className="font-medium text-gray-800">{medicine.description || "-"}</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    {!cartItem ? (
                        <button
                            onClick={() => addMedicine(medicine)}
                            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl text-lg shadow-lg shadow-cyan-200 transition"
                        >
                            Add to Cart
                        </button>
                    ) : (
                        <div className="flex items-center justify-between w-full gap-4">
                            <div className="flex flex-1 items-center justify-between bg-gray-100 rounded-xl px-4 py-2">
                                <button onClick={() => updateQuantity(medicine._id, cartItem.quantity - 1)} className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50"><Minus className="w-5 h-5" /></button>
                                <span className="font-bold text-xl">{cartItem.quantity}</span>
                                <button onClick={() => updateQuantity(medicine._id, cartItem.quantity + 1)} className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50"><Plus className="w-5 h-5" /></button>
                            </div>
                            <Link href="/dashboard/medicine/cart" className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl text-center shadow-lg shadow-cyan-200">
                                Go to Cart
                            </Link>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
