"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { medicineService, Medicine } from "@/services/medicine.service";
import { useMedicineCart } from "@/context/MedicineCartContext";
import { useAuthContext } from "@/state/AuthContext";
import MedicineCard from "@/components/store/MedicineCard";
import { ArrowLeft, Minus, Plus, ShoppingBag, ChevronRight, Share2, Star, ShieldCheck, Activity, Package, Info, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function MedicineDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [medicine, setMedicine] = useState<Medicine | null>(null);
    const [similarMedicines, setSimilarMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [similarLoading, setSimilarLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { items, addMedicine, updateQuantity } = useMedicineCart();
    const { user } = useAuthContext();

    const loadData = useCallback(async (medId: string) => {
        setLoading(true);
        setSimilarLoading(true);
        try {
            const medData = await medicineService.getMedicineById(medId);
            if (medData) {
                setMedicine(medData);
                // Fetch similar medicines based on category/therapeutic use
                const related = await medicineService.getRelatedMedicines(medData);
                setSimilarMedicines(related);
            }
        } catch (err) {
            console.error("Error loading medicine details:", err);
        } finally {
            setLoading(false);
            setSimilarLoading(false);
        }
    }, []);

    useEffect(() => {
        if (id) {
            loadData(id as string);
        }
    }, [id, loadData]);

    const handleScroll = () => {
        if (scrollRef.current) {
            const width = scrollRef.current.clientWidth;
            const scrollLeft = scrollRef.current.scrollLeft;
            const index = Math.round(scrollLeft / width);
            setActiveImage(index);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <div className="w-16 h-16 border-4 border-cyan-100 border-t-cyan-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-400 font-bold animate-pulse">Loading Product Details...</p>
            </div>
        );
    }

    if (!medicine) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Info className="w-10 h-10 text-gray-300" />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Medicine Not Found</h2>
                <p className="text-gray-500 mt-2 max-w-xs mx-auto">The medicine you're looking for might have been removed or the ID is invalid.</p>
                <button
                    onClick={() => router.push("/medicine-store")}
                    className="mt-8 px-8 py-3 bg-cyan-600 text-white rounded-2xl font-bold hover:bg-cyan-700 transition-all"
                >
                    Back to Store
                </button>
            </div>
        );
    }

    // Role-based pricing
    const isAgent = user?.roles?.some((r) => r.toLowerCase().includes("agent") || r.toLowerCase().includes("admin")) ?? false;
    const mrp = medicine.pricing?.mrp || 0;
    const price = medicine.pricing?.price || 0;
    const specialPrice = medicine.pricing?.specialPrice || 0;
    const payPrice = (isAgent && specialPrice > 0) ? specialPrice : price;
    const discount = (mrp > payPrice && mrp > 0) ? Math.round(((mrp - payPrice) / mrp) * 100) : 0;

    const cartItem = items.find(i => i._id === medicine._id);
    const qty = cartItem ? cartItem.quantity : 0;

    // 🔥 MOCK STOCK FOR UI TESTING (Matches Card behavior)
    const isOutOfStock = false;

    return (
        <div className="min-h-screen bg-gray-50/50 relative pb-32">
            {/* Nav Header */}
            <div className="bg-white/80 backdrop-blur-xl sticky top-0 z-30 px-4 py-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2.5 hover:bg-gray-50 rounded-2xl text-gray-600 border border-transparent hover:border-gray-100 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="font-black text-gray-900 truncate max-w-[180px] md:max-w-xs">{medicine.name}</span>
                </div>
                <div className="flex gap-2">
                    <button className="p-2.5 hover:bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-600 transition-colors">
                        <Share2 className="w-5 h-5" />
                    </button>
                    <Link href="/medicine-store/cart" className="p-2.5 bg-cyan-50 text-cyan-600 rounded-2xl hover:bg-cyan-100 transition-all relative">
                        <ShoppingBag className="w-5 h-5" />
                        {items.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full text-[10px] flex items-center justify-center text-white font-black">{items.length}</span>
                        )}
                    </Link>
                </div>
            </div>

            <main className="max-w-5xl mx-auto lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT: Images */}
                    <div className="lg:col-span-6 bg-white lg:rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="relative aspect-square md:aspect-[4/3] lg:aspect-square bg-gray-50/50 p-12">
                            <div
                                ref={scrollRef}
                                onScroll={handleScroll}
                                className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full w-full"
                            >
                                {medicine.images && medicine.images.length > 0 ? (
                                    medicine.images.map((img, idx) => (
                                        <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
                                            <Image
                                                src={img.url}
                                                alt={medicine.name}
                                                fill
                                                className="object-contain"
                                                priority
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                        <Package size={64} className="opacity-10 mb-4" />
                                        <p className="font-bold uppercase tracking-widest text-xs">No Product Image</p>
                                    </div>
                                )}
                            </div>

                            {isOutOfStock && (
                                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl shadow-xl border border-red-50 text-red-600 font-black text-xs uppercase tracking-widest">
                                    Out of Stock
                                </div>
                            )}

                            {discount > 0 && (
                                <div className="absolute top-6 right-6 bg-emerald-500 px-4 py-2 rounded-2xl shadow-xl text-white font-black text-xs uppercase tracking-widest animate-bounce">
                                    {discount}% OFF
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {medicine.images && medicine.images.length > 1 && (
                            <div className="p-6 flex justify-center gap-3 bg-white border-t border-gray-50">
                                {medicine.images.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            scrollRef.current?.scrollTo({ left: scrollRef.current.clientWidth * idx, behavior: 'smooth' });
                                            setActiveImage(idx);
                                        }}
                                        className={`h-2.5 rounded-full transition-all duration-500 ${activeImage === idx ? 'w-10 bg-cyan-600 shadow-lg shadow-cyan-100' : 'w-2.5 bg-gray-200 hover:bg-gray-300'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Content */}
                    <div className="lg:col-span-6 space-y-6 px-4 md:px-0">
                        {/* Summary Card */}
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-cyan-50 text-cyan-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {medicine.dosageForm}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${medicine.prescriptionType === 'RX' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {medicine.prescriptionType === 'RX' ? 'Prescription Required' : 'Over the Counter'}
                                </span>
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 leading-tight mb-2">{medicine.name}</h1>
                            <p className="text-gray-400 font-bold text-sm tracking-wide">Brand: <span className="text-cyan-600 underline cursor-pointer">{medicine.brandName || "Generic"}</span></p>

                            <div className="mt-8 flex items-end gap-4">
                                <div className="space-y-1">
                                    <p className="text-gray-400 text-sm font-bold line-through ml-1">MRP ₹{mrp}</p>
                                    <p className="text-5xl font-black text-gray-900 tracking-tighter">₹{payPrice}</p>
                                </div>
                                {isAgent && specialPrice > 0 && (
                                    <div className="mb-1 flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-tighter border border-orange-100">
                                        <Star size={12} className="fill-orange-600" />
                                        Agent pricing
                                    </div>
                                )}
                            </div>

                            {/* Qty Actions (Desktop) */}
                            <div className="mt-10 hidden md:block">
                                <QuantityBox medicine={medicine} qty={qty} isOutOfStock={isOutOfStock} onAdd={() => addMedicine(medicine)} onUpdate={(q) => updateQuantity(medicine._id, q)} />
                            </div>
                        </div>

                        {/* Features Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quality</p>
                                    <p className="text-sm font-bold text-gray-900">Verified</p>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</p>
                                    <p className="text-sm font-bold text-gray-900">{medicine.therapeuticUse || "General"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Full Details Section */}
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-0">
                    <div className="lg:col-span-8 space-y-8">
                        {/* Description */}
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                <Info className="text-cyan-600" /> Product Description
                            </h2>
                            <div className="prose prose-cyan text-gray-600 font-medium leading-relaxed max-w-none">
                                {medicine.description || "No specific detailed description provided for this medicine."}
                            </div>
                        </div>

                        {/* Composition */}
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                            <h2 className="text-xl font-black text-gray-900 mb-6">Key Composition</h2>
                            <div className="space-y-4">
                                {medicine.composition && medicine.composition.length > 0 ? (
                                    medicine.composition.map((c, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-hover hover:border-cyan-200">
                                            <span className="font-extrabold text-gray-800">{c.ingredient}</span>
                                            <span className="px-4 py-1.5 bg-white rounded-xl text-sm font-black text-cyan-700 shadow-sm">{c.strength}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 italic font-medium p-4 text-center border-2 border-dashed border-gray-100 rounded-3xl">Detailed composition data not available.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        {/* Spec Highlights */}
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                            <h2 className="text-xl font-black text-gray-900 mb-6">Specifications</h2>
                            <div className="space-y-6">
                                <SpecItem label="Form Factor" value={medicine.dosageForm} />
                                <SpecItem label="Manuf." value={medicine.manufacturer?.name} />
                                <SpecItem label="Alert Level" value={`${medicine.stock?.minAlertQuantity || 10} Units`} />
                                <SpecItem label="Added On" value={medicine.createdAt ? new Date(medicine.createdAt).toLocaleDateString() : 'N/A'} />
                            </div>
                        </div>

                        {/* Manufacturer Contact */}
                        <div className="bg-gray-900 p-8 rounded-[40px] shadow-2xl text-white">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-400 mb-6">Manufacturer Info</h3>
                            <div className="space-y-4">
                                <p className="text-lg font-black">{medicine.manufacturer?.name || "Standard Pharmaceuticals"}</p>
                                {medicine.manufacturer?.licenseNumber && (
                                    <p className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                                        Lic: {medicine.manufacturer.licenseNumber}
                                    </p>
                                )}
                                <div className="pt-4 border-t border-white/10 mt-4">
                                    <p className="text-xs font-medium text-gray-500 leading-relaxed italic">
                                        {medicine.manufacturer?.address || "Address not provided in records."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products Section */}
                <div className="mt-20 px-4 md:px-0">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Related Medicines</h2>
                            <p className="text-gray-500 font-medium mt-1">Customers who viewed this also considered</p>
                        </div>
                        <Link href="/medicine-store" className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-900 font-black rounded-2xl border border-gray-100 shadow-sm transition-all text-sm uppercase tracking-widest">
                            View All
                        </Link>
                    </div>

                    {similarLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-64 bg-white rounded-3xl animate-pulse" />
                            ))}
                        </div>
                    ) : similarMedicines.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {similarMedicines.map(sim => (
                                <MedicineCard key={sim._id} medicine={sim} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center bg-white rounded-[40px] border border-gray-50 text-gray-400">
                            <Info size={48} className="mx-auto mb-4 opacity-10" />
                            <p className="font-bold tracking-tight">No related medicines found in this category.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Sticky Mobile Buy Component */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-2xl border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:hidden z-40">
                <div className="max-w-xl mx-auto flex items-center justify-between gap-6">
                    <div className="shrink-0">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Price</p>
                        <p className="text-2xl font-black text-gray-900 tracking-tighter">₹{(payPrice * (qty || 1)).toFixed(2)}</p>
                    </div>
                    <div className="flex-1">
                        <QuantityBox medicine={medicine} qty={qty} isOutOfStock={isOutOfStock} onAdd={() => addMedicine(medicine)} onUpdate={(q) => updateQuantity(medicine._id, q)} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Subcomponents

function QuantityBox({ medicine, qty, isOutOfStock, onAdd, onUpdate }: { medicine: Medicine, qty: number, isOutOfStock: boolean, onAdd: () => void, onUpdate: (q: number) => void }) {
    if (qty === 0) {
        return (
            <button
                onClick={onAdd}
                disabled={isOutOfStock}
                className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-lg font-black py-4 rounded-3xl shadow-xl shadow-cyan-100 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:shadow-none"
            >
                {isOutOfStock ? "Out of Stock" : <>Add to Cart <Plus size={20} /></>}
            </button>
        );
    }

    return (
        <div className="flex items-center justify-between bg-gray-100 p-1.5 rounded-[28px] border border-gray-200 shadow-inner">
            <button
                onClick={() => onUpdate(qty - 1)}
                className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm text-gray-900 hover:bg-gray-50 transition-all"
            >
                <Minus size={20} />
            </button>
            <span className="text-xl font-black text-gray-900 mx-4">{qty}</span>
            <button
                onClick={() => onUpdate(qty + 1)}
                className="w-12 h-12 flex items-center justify-center bg-cyan-600 rounded-2xl shadow-lg shadow-cyan-100 text-white hover:bg-cyan-700 transition-all"
            >
                <Plus size={20} />
            </button>
        </div>
    );
}

function SpecItem({ label, value }: { label: string, value?: string }) {
    if (!value) return null;
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
            <span className="text-sm font-extrabold text-gray-800 truncate">{value}</span>
        </div>
    );
}
