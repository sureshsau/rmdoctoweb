"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { medicineService, Medicine } from "@/services/medicine.service";
import { useMedicineCart } from "@/context/MedicineCartContext";
import { useAuthContext } from "@/state/AuthContext";
import { ArrowLeft, Minus, Plus, ShoppingBag, ChevronRight, Share2, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function MedicineDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [medicine, setMedicine] = useState<Medicine | null>(null);
    const [similarMedicines, setSimilarMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { items, addMedicine, updateQuantity } = useMedicineCart();
    const { user } = useAuthContext();

    useEffect(() => {
        if (id) {
            loadData(id as string);
        }
    }, [id]);

    async function loadData(medId: string) {
        setLoading(true);
        try {
            // 1. Fetch Main Medicine
            const medData = await medicineService.getMedicineById(medId);
            if (medData) {
                setMedicine(medData);

                // 2. Fetch Similar (Random fetch for now, or based on category)
                // We'll just fetch page 1 and filter out current
                const similarRes = await medicineService.getAllMedicines({ limit: 6 });
                if (similarRes && similarRes.data) {
                    setSimilarMedicines(similarRes.data.filter(m => m._id !== medId));
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // Scroll Handler for Carousel
    const handleScroll = () => {
        if (scrollRef.current) {
            const width = scrollRef.current.clientWidth;
            const scrollLeft = scrollRef.current.scrollLeft;
            const index = Math.round(scrollLeft / width);
            setActiveImage(index);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-teal-600 font-bold">Loading...</div>;
    if (!medicine) return <div className="min-h-screen flex items-center justify-center">Medicine not found</div>;

    // --- Role & Pricing Logic ---
    const isAgent = user?.roles?.some((r) => r.toLowerCase().includes("agent") || r.toLowerCase().includes("admin")) ?? false;
    const mrp = medicine.pricing?.mrp || 0;
    const price = medicine.pricing?.price || 0; // Public Selling Price
    const specialPrice = medicine.pricing?.specialPrice || 0; // Agent Selling Price

    // The actual price the user pays
    const payPrice = (isAgent && specialPrice > 0) ? specialPrice : price;

    // Discount based on MRP vs PayPrice
    const discount = (mrp > payPrice && mrp > 0) ? Math.round(((mrp - payPrice) / mrp) * 100) : 0;

    // Stock (Ignored)
    const isOutOfStock = false;

    // Cart
    const cartItem = items.find(i => i._id === medicine._id);
    const qty = cartItem ? cartItem.quantity : 0;

    // Bottom Bar Total (Current Price * Qty) 
    const currentTotal = (payPrice * Math.max(1, qty));

    return (
        <div className="min-h-screen bg-gray-50 relative pb-[100px]">
            {/* ================= HEADER ================= */}
            <div className="bg-white sticky top-0 z-20 px-4 py-3 flex items-center justify-between border-b border-gray-100 shadow-sm">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft className="w-6 h-6 text-gray-700" />
                </button>
                <div className="flex gap-3">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600">
                        <Share2 className="w-5 h-5" />
                    </button>
                    <Link href="/medicine-store/cart" className="p-2 hover:bg-gray-100 rounded-full transition text-teal-600 relative">
                        <ShoppingBag className="w-6 h-6" />
                        {items.length > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full text-[9px] flex items-center justify-center text-white font-bold">{items.length}</span>
                        )}
                    </Link>
                </div>
            </div>

            <div className="max-w-xl mx-auto">
                {/* ================= IMAGE CAROUSEL ================= */}
                <div className="bg-white pb-6 pt-2">
                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full aspect-[4/3]"
                    >
                        {medicine.images && medicine.images.length > 0 ? (
                            medicine.images.map((img, idx) => (
                                <div key={idx} className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center p-8">
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={img.url}
                                            alt={medicine.name}
                                            fill
                                            className="object-contain mix-blend-multiply"
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                No Image
                            </div>
                        )}
                    </div>
                    {/* Dots */}
                    {medicine.images && medicine.images.length > 1 && (
                        <div className="flex justify-center gap-1.5 mt-4">
                            {medicine.images.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-2 rounded-full transition-all duration-300 ${activeImage === idx ? 'w-6 bg-teal-500' : 'w-2 bg-gray-300'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* ================= BASIC INFO ================= */}
                <div className="m-4 p-5 bg-white rounded-3xl shadow-sm">
                    <h1 className="text-xl font-extrabold text-gray-900 leading-snug">{medicine.name}</h1>
                    <div className="flex items-center gap-1 mt-1 text-teal-600 font-semibold text-sm">
                        <span>Visit {medicine.brandName || "Generic"} Store</span>
                        <ChevronRight className="w-4 h-4" />
                    </div>

                    <div className="mt-4 flex flex-col gap-1">
                        <span className="text-lg text-gray-400 line-through">MRP ₹{mrp}</span>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-extrabold text-teal-600">₹{payPrice}</span>
                            {discount > 0 && (
                                <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg text-sm">
                                    {discount}% OFF
                                </span>
                            )}
                        </div>
                        {isAgent && specialPrice > 0 && (
                            <span className="text-sm font-bold text-orange-500 mt-1 flex items-center gap-1">
                                <Star className="w-4 h-4 fill-orange-500" /> Agent Price Applied
                            </span>
                        )}
                    </div>
                    {isOutOfStock && (
                        <div className="mt-3 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold inline-block border border-red-100">
                            Currently Out of Stock
                        </div>
                    )}
                </div>

                {/* ================= QUANTITY / ADD ================= */}
                <div className="mx-4 mb-5 p-4 bg-white rounded-3xl shadow-sm">
                    {qty === 0 ? (
                        <button
                            onClick={() => addMedicine(medicine)}
                            disabled={isOutOfStock}
                            className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-lg font-bold py-3.5 rounded-2xl shadow-lg shadow-teal-100 transition"
                        >
                            {isOutOfStock ? "Notify Me" : "Add to Cart"}
                        </button>
                    ) : (
                        <div className="flex items-center justify-between bg-cyan-50 p-3 rounded-2xl">
                            <button onClick={() => updateQuantity(medicine._id, qty - 1)} className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-xs text-teal-700 hover:scale-105 transition"><Minus className="w-6 h-6 stroke-[3]" /></button>
                            <span className="text-xl font-extrabold text-gray-800">{qty}</span>
                            <button onClick={() => updateQuantity(medicine._id, qty + 1)} className="w-12 h-12 flex items-center justify-center bg-teal-500 rounded-xl shadow-lg shadow-teal-200 text-white hover:scale-105 transition"><Plus className="w-6 h-6 stroke-[3]" /></button>
                        </div>
                    )}
                </div>

                {/* ================= DETAILS section ================= */}
                <div className="m-4 p-5 bg-white rounded-3xl shadow-sm space-y-6">
                    <h2 className="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-2">Product Details</h2>

                    <DetailCard title="Therapeutic Use" content={medicine.therapeuticUse || "Not specified"} />

                    {/* Composition Special Layout */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1 h-5 bg-teal-500 rounded-full" />
                            <span className="font-bold text-gray-800">Composition</span>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100">
                            {medicine.composition && medicine.composition.length > 0 ? (
                                medicine.composition.map((c, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
                                            <span className="text-gray-700 font-medium">{c.ingredient}</span>
                                        </div>
                                        <span className="font-bold text-gray-900">{c.strength}</span>
                                    </div>
                                ))
                            ) : (
                                <span className="text-gray-400 text-sm">No composition data</span>
                            )}
                        </div>
                    </div>

                    <DetailCard title="Description" content={medicine.description || "No description available."} />

                    <div className="grid grid-cols-2 gap-4">
                        <InfoTile label="Dosage Form" value={medicine.dosageForm} />
                        <InfoTile label="Prescription" value={medicine.prescriptionType} />
                        <InfoTile label="Manufacturer" value={medicine.manufacturer?.name} />
                    </div>
                </div>

                {/* ================= SIMILAR PRODUCTS ================= */}
                <div className="m-4 mb-8 bg-white rounded-3xl shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-extrabold text-gray-900">Similar Products</h2>
                        <Link href="/medicine-store" className="text-sm font-bold text-teal-600">View all</Link>
                    </div>

                    <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar">
                        {similarMedicines.length > 0 ? (
                            similarMedicines.map(sim => (
                                <Link href={`/medicine-store/${sim._id}`} key={sim._id} className="min-w-[160px] max-w-[160px] bg-gray-50 rounded-2xl p-3 border border-gray-100 flex flex-col">
                                    <div className="bg-white rounded-xl p-2 h-24 mb-3 flex items-center justify-center relative">
                                        {/* Discount Badge if Applicable */}
                                        {/* <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">10% OFF</div> */}
                                        {sim.images && sim.images[0] ? (
                                            <img src={sim.images[0].url} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                        ) : (<div className="text-[10px] text-gray-300">No Img</div>)}
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-1 leading-tight h-9">{sim.name}</h3>
                                    <div className="mt-auto pt-2 flex items-center justify-between">
                                        <span className="font-extrabold text-gray-900">₹{sim.pricing?.mrp || 0}</span>
                                        <button className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 hover:bg-teal-200">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-gray-400 text-sm py-4">No similar products found.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* ================= BOTTOM BAR ================= */}
            {qty > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-6 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-30 animate-in slide-in-from-bottom-5">
                    <div className="max-w-xl mx-auto flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-0.5">Total Pay</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-extrabold text-gray-900">₹{currentTotal.toFixed(2)}</span>
                                <span className="text-sm text-gray-400 font-medium">for {qty} items</span>
                            </div>
                        </div>
                        <Link
                            href="/medicine-store/cart"
                            className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3.5 rounded-2xl font-bold text-lg shadow-lg shadow-teal-200 transition active:scale-95"
                        >
                            View Cart
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

// Reuseable Components

function DetailCard({ title, content }: { title: string, content: string }) {
    if (!content) return null;
    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-5 bg-teal-500 rounded-full" />
                <span className="font-bold text-gray-800">{title}</span>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-sm leading-relaxed text-gray-600 border border-gray-100">
                {content}
            </div>
        </div>
    );
}

function InfoTile({ label, value }: { label: string, value?: string }) {
    if (!value) return null;
    return (
        <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
            <p className="text-xs text-gray-400 font-bold uppercase mb-1">{label}</p>
            <p className="text-sm font-bold text-gray-700">{value}</p>
        </div>
    );
}
