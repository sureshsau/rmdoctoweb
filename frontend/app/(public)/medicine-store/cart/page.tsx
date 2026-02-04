"use client";

import { useMedicineCart } from "@/context/MedicineCartContext";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, MapPin, CheckCircle, Smartphone, User, Home, Building, Flag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/state/AuthContext";
import { useState } from "react";
import { orderService, OrderPayload } from "@/services/order.service";

export default function PublicCartPage() {
    const { items, totalPrice, updateQuantity, clearCart } = useMedicineCart();
    const { user } = useAuthContext();
    const router = useRouter();

    const [view, setView] = useState<"cart" | "checkout">("cart");
    const [loading, setLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    // Checkout State
    const [address, setAddress] = useState({
        fullName: user?.name || "",
        phone: user?.phone || "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
    });
    const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
    const [locLoading, setLocLoading] = useState(false);

    // Helper to get correct price per item (Public = MRP)
    // Note: User logic says Public sees MRP, Agent sees Special.
    // We should strictly stick to what the CARD shows. Card shows MRP for public.
    // Helper to get correct price per item
    // Public: Price (Selling Price)
    // Agent: SpecialPrice
    // MRP is only for display
    const getPrice = (item: any) => {
        // Agent Logic
        const isAgent = user?.roles?.some((r) => r.toLowerCase().includes("agent") || r.toLowerCase().includes("admin")) ?? false;

        const price = item.pricing?.price || 0;
        const specialPrice = item.pricing?.specialPrice || 0;

        if (isAgent && specialPrice > 0) {
            return specialPrice;
        }
        return price;
    };

    const actualTotal = items.reduce((sum, item) => sum + (getPrice(item) * item.quantity), 0);

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAddress({ ...address, [e.target.name]: e.target.value });
    };

    const fetchLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }
        setLocLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // MongoDB expects [longitude, latitude]
                setCoordinates([longitude, latitude]);
                setLocLoading(false);
                // Ideally we would reverse geocode here to fill city/state, but without API key we just store coords.
                alert(`Location Fetched! Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            },
            (error) => {
                console.error(error);
                setLocLoading(false);
                alert("Unable to retrieve your location");
            }
        );
    };

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload: OrderPayload = {
            items: items.map(i => ({ medicineId: i._id, quantity: i.quantity })),
            deliveryAddress: {
                ...address,
                location: coordinates ? { coordinates } : undefined
            },
            paymentMode: "COD"
        };

        console.log("Placing Order Payload:", JSON.stringify(payload, null, 2));

        try {
            await orderService.placeOrder(payload);
            setOrderSuccess(true);
            clearCart();
            setTimeout(() => {
                router.push("/medicine-store");
            }, 3000);
        } catch (err) {
            console.error(err);
            alert("Failed to place order. Backend endpoint might be missing.");
            setLoading(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
                <div className="bg-green-50 p-6 rounded-full mb-4 animate-bounce">
                    <CheckCircle className="w-16 h-16 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h2>
                <p className="text-gray-500 text-center">Thank you for your purchase. Redirecting to store...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center gap-4 border-b border-gray-100 sticky top-0 z-20 shadow-sm">
                <button
                    onClick={() => view === 'checkout' ? setView('cart') : router.back()}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="font-bold text-gray-800 flex-1">{view === 'checkout' ? 'Checkout' : 'My Cart'}</h1>
                <div className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold">
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
                        <Link href="/medicine-store" className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-teal-100 transition hover:bg-teal-700">
                            Browse Medicines
                        </Link>
                    </div>
                ) : (
                    <>
                        {view === 'cart' ? (
                            /* ================= CART VIEW ================= */
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    {items.map(item => {
                                        const price = getPrice(item);
                                        return (
                                            <div key={item._id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                                                <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
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
                                                        <span className="text-lg font-bold text-teal-600">₹{price * item.quantity}</span>

                                                        <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                                                            <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="p-1 hover:bg-white rounded-md transition shadow-xs"><Minus className="w-4 h-4 text-gray-600" /></button>
                                                            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                                            <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="p-1 hover:bg-white rounded-md transition shadow-xs"><Plus className="w-4 h-4 text-gray-600" /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                                    <div className="flex justify-between text-lg font-bold text-gray-900">
                                        <span>Total Amount</span>
                                        <span>₹{actualTotal.toFixed(2)}</span>
                                    </div>
                                    <button
                                        onClick={() => setView('checkout')}
                                        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-200 mt-4 transition active:scale-95"
                                    >
                                        Proceed to Checkout
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ================= CHECKOUT VIEW ================= */
                            <form onSubmit={handlePlaceOrder} className="space-y-6">
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-teal-500" /> Delivery Address
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputGroup icon={<User />} name="fullName" placeholder="Full Name" value={address.fullName} onChange={handleAddressChange} required />
                                        <InputGroup icon={<Smartphone />} name="phone" placeholder="Phone Number" value={address.phone} onChange={handleAddressChange} required />
                                    </div>

                                    <div className="space-y-4 pt-2">
                                        <div className="flex gap-2">
                                            <InputGroup icon={<Home />} name="addressLine1" placeholder="Address Line 1" value={address.addressLine1} onChange={handleAddressChange} required className="flex-1" />
                                            <button
                                                type="button"
                                                onClick={fetchLocation}
                                                className={`px-4 bg-teal-50 text-teal-700 font-bold rounded-xl text-xs flex flex-col items-center justify-center gap-1 min-w-[80px] hover:bg-teal-100 transition ${locLoading ? 'opacity-50' : ''}`}
                                            >
                                                <MapPin className="w-4 h-4" />
                                                {locLoading ? "..." : (coordinates ? "Updated" : "Locate Me")}
                                            </button>
                                        </div>
                                        {coordinates && (
                                            <p className="text-xs text-green-600 font-medium ml-1">
                                                ✓ Location coordinates captured
                                            </p>
                                        )}
                                        <InputGroup name="addressLine2" placeholder="Address Line 2 (Optional)" value={address.addressLine2} onChange={handleAddressChange} />

                                        <div className="grid grid-cols-3 gap-3">
                                            <InputGroup icon={<Building />} name="city" placeholder="City" value={address.city} onChange={handleAddressChange} required />
                                            <InputGroup icon={<Flag />} name="state" placeholder="State" value={address.state} onChange={handleAddressChange} required />
                                            <InputGroup name="pincode" placeholder="Pincode" value={address.pincode} onChange={handleAddressChange} required />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                    <h2 className="text-lg font-bold text-gray-800">Payment Method</h2>
                                    <div className="border border-teal-500 bg-teal-50 p-4 rounded-xl flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full border-[5px] border-teal-600 bg-white" />
                                        <span className="font-bold text-gray-800">Cash on Delivery (COD)</span>
                                    </div>
                                </div>

                                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-30">
                                    <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase">To Pay</p>
                                            <p className="text-xl font-extrabold text-gray-900">₹{actualTotal.toFixed(2)}</p>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-teal-200 transition disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {loading ? "Placing Order..." : "Place Order"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function InputGroup({ icon, className = "", ...props }: any) {
    return (
        <div className={`relative ${className}`}>
            {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4">{icon}</div>}
            <input
                {...props}
                className={`w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition py-3 px-4 ${icon ? 'pl-10' : ''}`}
            />
        </div>
    )
}
