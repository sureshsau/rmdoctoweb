"use client";

import { useMedicineCart } from "@/context/MedicineCartContext";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, MapPin, CheckCircle, Smartphone, User, Home, Building, Flag, ShieldCheck, ChevronRight, CreditCard, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/state/AuthContext";
import { useState, useMemo, useEffect } from "react";
import { orderService, OrderPayload } from "@/services/order.service";

declare global {
    interface Window {
        Razorpay?: any;
    }
}

let razorpayScriptPromise: Promise<boolean> | null = null;

const loadRazorpayScript = () => {
    if (razorpayScriptPromise) return razorpayScriptPromise;

    razorpayScriptPromise = new Promise((resolve) => {
        if (typeof window === "undefined") {
            resolve(false);
            return;
        }

        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

    return razorpayScriptPromise;
};

type CheckoutStep = "cart" | "address" | "payment" | "summary";

export default function PublicCartPage() {
    const { items, totalPrice, totalTax, updateQuantity, removeMedicine, clearCart } = useMedicineCart();
    const { user, isAuthenticated } = useAuthContext();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize step from URL search param if present
    const [step, setStep] = useState<CheckoutStep>((searchParams.get("step") as CheckoutStep) || "cart");
    const [loading, setLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [paymentMode, setPaymentMode] = useState<OrderPayload["paymentMode"]>("COD");
    const [pendingOnlineOrderId, setPendingOnlineOrderId] = useState<string | null>(null);

    // Address State
    const [address, setAddress] = useState({
        fullName: user?.name || "",
        phone: user?.phone || "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
    });

    // Auto-fill address when user becomes available
    useEffect(() => {
        if (user) {
            setAddress(prev => ({
                ...prev,
                fullName: user.name || prev.fullName,
                phone: user.phone || prev.phone
            }));
        }
    }, [user]);
    const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
    const [locLoading, setLocLoading] = useState(false);

    const isAgent = useMemo(() =>
        user?.roles?.some((r) => r.toLowerCase().includes("agent") || r.toLowerCase().includes("admin")) ?? false,
        [user]);

    // Financial Breakdown
    const subtotal = totalPrice;
    const gstTotal = totalTax; // Using actual tax from context
    const grandTotal = subtotal + gstTotal;

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
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCoordinates([longitude, latitude]);

                try {
                    // Reverse Geocoding via Nominatim (Free/OpenSource)
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await res.json();

                    if (data && data.address) {
                        const { city, town, village, state, postcode, road, suburb } = data.address;
                        setAddress(prev => ({
                            ...prev,
                            addressLine1: [road, suburb].filter(Boolean).join(", ") || prev.addressLine1,
                            city: city || town || village || prev.city,
                            state: state || prev.state,
                            pincode: postcode || prev.pincode
                        }));
                    }
                } catch (err) {
                    console.error("Reverse Geocoding failed:", err);
                } finally {
                    setLocLoading(false);
                }
            },
            (error) => {
                console.error(error);
                setLocLoading(false);
                alert("Unable to retrieve your location. Please ensure site has location permissions.");
            },
            { enableHighAccuracy: true }
        );
    };

    const handlePlaceOrder = async () => {
        setLoading(true);

        let finalCoords = coordinates;

        // 🛡️ SECURITY FALLBACK: If user didn't click "Auto-Locate", try geocoding the Pincode
        if (!finalCoords && address.pincode) {
            try {
                const geoRes = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&postalcode=${address.pincode}&country=India`
                );
                const geoData = await geoRes.json();
                if (geoData && geoData.length > 0) {
                    finalCoords = [parseFloat(geoData[0].lon), parseFloat(geoData[0].lat)];
                }
            } catch (err) {
                console.error("Manual geocoding fallback failed:", err);
            }
        }

        // Final Block: If we STILL don't have coords, we must inform the user
        // since the backend schema specifies coordinates are REQUIRED.
        if (!finalCoords) {
            alert("To assign a delivery associate, we need a precise location pin. Please click 'Auto-Locate' or ensure your Pincode is correct.");
            setLoading(false);
            return;
        }

        const payload: OrderPayload = {
            items: items.map(i => ({ medicineId: i._id, quantity: i.quantity })),
            deliveryAddress: {
                ...address,
                location: {
                    type: "Point",
                    coordinates: finalCoords
                }
            },
            paymentMode: paymentMode
        };

        try {
            let createdOrderId = pendingOnlineOrderId;

            if (paymentMode !== "ONLINE") {
                const orderResponse = await orderService.placeOrder(payload);
                createdOrderId =
                    orderResponse?.data?.orderId ||
                    orderResponse?.data?._id ||
                    orderResponse?.data?.data?.orderId ||
                    orderResponse?.data?.data?._id ||
                    null;

                setOrderSuccess(true);
                clearCart();
                setTimeout(() => router.push("/medicine-store"), 5000);
                return;
            }

            if (!createdOrderId) {
                const orderResponse = await orderService.placeOrder(payload);
                createdOrderId =
                    orderResponse?.data?.orderId ||
                    orderResponse?.data?._id ||
                    orderResponse?.data?.data?.orderId ||
                    orderResponse?.data?.data?._id ||
                    null;
                if (createdOrderId) {
                    setPendingOnlineOrderId(createdOrderId);
                }
            }

            if (!createdOrderId) {
                throw new Error("Order id missing from server response");
            }

            const razorpayReady = await loadRazorpayScript();
            if (!razorpayReady || !window.Razorpay) {
                throw new Error("Razorpay SDK failed to load");
            }

            const razorpayOrder = await orderService.createRazorpayOrder(createdOrderId);

            const options = {
                key: razorpayOrder.data.key,
                amount: razorpayOrder.data.amount,
                currency: razorpayOrder.data.currency,
                name: "RM Docto",
                description: "Medicine Order Payment",
                order_id: razorpayOrder.data.razorpayOrderId,
                prefill: {
                    name: razorpayOrder.data.user?.name || user?.name || "",
                    contact: razorpayOrder.data.user?.phone || user?.phone || ""
                },
                handler: async (response: any) => {
                    try {
                        await orderService.verifyRazorpayPayment({
                            orderId: createdOrderId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        setOrderSuccess(true);
                        clearCart();
                        setTimeout(() => router.push("/medicine-store"), 5000);
                    } catch (verifyError) {
                        console.error(verifyError);
                        alert("Payment verification failed. Please contact support if payment was deducted.");
                    } finally {
                        setLoading(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                        router.push("/medicine-store/orders");
                    }
                }
            };

            const razorpayInstance = new window.Razorpay(options);
            razorpayInstance.open();
        } catch (err) {
            console.error(err);
            alert("Failed to place order. Technical issue on server.");
            setLoading(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-100">
                    <CheckCircle className="w-12 h-12 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Order Confirmed!</h2>
                <p className="text-gray-500 max-w-xs font-medium">Your request has been sent. You can track your order and find your delivery PIN in your history.</p>
                <Link href="/medicine-store/orders" className="mt-8 px-8 py-3 bg-cyan-600 text-white rounded-2xl font-bold shadow-xl shadow-cyan-100 hover:bg-cyan-700 transition-all flex items-center gap-2">
                    <Truck size={18} /> Track Order History
                </Link>
                <div className="mt-10 w-full max-w-xs h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 animate-[progress_5s_linear]" style={{ width: '100%' }} />
                </div>
            </div>
        );
    }

    const currentStepIndex = step === 'cart' ? 1 : step === 'address' ? 2 : step === 'payment' ? 3 : 4;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32">
            {/* Nav Header */}
            <div className="bg-white/80 backdrop-blur-xl sticky top-0 z-30 px-4 py-4 border-b border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (step === 'cart') router.back();
                            else if (step === 'address') setStep('cart');
                            else if (step === 'payment') setStep('address');
                            else setStep('payment');
                        }}
                        className="p-2.5 hover:bg-gray-50 rounded-2xl text-gray-600 border border-transparent hover:border-gray-100 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-black text-gray-900 tracking-tight">
                            {step === 'cart' ? 'My Shopping Cart' : step === 'address' ? 'Delivery Location' : step === 'payment' ? 'Payment Method' : 'Order Summary'}
                        </h1>
                        <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest leading-none mt-0.5">Step {currentStepIndex} of 4</p>
                    </div>
                </div>
                <button onClick={clearCart} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <Trash2 size={20} />
                </button>
            </div>

            <main className="max-w-3xl mx-auto p-4 md:p-8">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-24 h-24 bg-white rounded-[40px] shadow-sm flex items-center justify-center mb-8 border border-gray-50">
                            <ShoppingBag className="w-10 h-10 text-gray-200" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900">Your cart is empty</h2>
                        <p className="text-gray-400 mt-2 font-medium max-w-xs">Looks like you haven't added any medicines yet. Browse our store to get started.</p>
                        <Link href="/medicine-store" className="mt-8 px-10 py-3.5 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl shadow-gray-200">
                            Shop Medicines
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* 🛒 STEP 1: CART LIST */}
                        {step === 'cart' && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-500">
                                {items.map(item => (
                                    <div key={item._id} className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 flex gap-5 group transition-hover">
                                        <div className="w-24 h-24 bg-gray-50 rounded-[24px] flex items-center justify-center shrink-0 p-4">
                                            {item.images?.[0]?.url ? (
                                                <img src={item.images[0].url} className="w-full h-full object-contain mix-blend-multiply" />
                                            ) : <Pill className="text-gray-200 w-10 h-10" />}
                                        </div>

                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-0.5">
                                                    <h3 className="font-black text-gray-900 leading-none truncate max-w-[140px] md:max-w-xs">{item.name}</h3>
                                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">{item.brandName}</p>
                                                </div>
                                                <button onClick={() => removeMedicine(item._id)} className="text-gray-300 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                                            </div>

                                            <div className="flex justify-between items-end">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Total Price</span>
                                                    <span className="text-xl font-black text-cyan-600">₹{(item.pricing?.price || 0) * item.quantity}</span>
                                                </div>

                                                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-100">
                                                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-xs text-gray-600 hover:bg-gray-100"><Minus size={14} /></button>
                                                    <span className="w-8 text-center font-black text-gray-900">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="w-9 h-9 flex items-center justify-center bg-cyan-600 rounded-xl shadow-lg shadow-cyan-100 text-white hover:bg-cyan-700"><Plus size={14} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 📍 STEP 2: ADDRESS FORM */}
                        {step === 'address' && (
                            <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                                <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
                                    <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-3"><MapPin size={24} className="text-cyan-600" /> Delivery Details</h2>
                                        <button
                                            onClick={fetchLocation}
                                            className={`flex items-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${locLoading ? 'animate-pulse' : 'hover:bg-cyan-100'}`}
                                        >
                                            <Flag size={14} /> {locLoading ? "Fetching..." : (coordinates ? "Captued ✓" : "Auto-Locate")}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FloatingInput label="Full Name" name="fullName" value={address.fullName} onChange={handleAddressChange} icon={<User size={18} />} />
                                        <FloatingInput label="Mobile Number" name="phone" value={address.phone} onChange={handleAddressChange} icon={<Smartphone size={18} />} />
                                    </div>

                                    <div className="space-y-6">
                                        <FloatingInput label="Block / House / Street No." name="addressLine1" value={address.addressLine1} onChange={handleAddressChange} icon={<Home size={18} />} />
                                        <FloatingInput label="Landmark / Area (Optional)" name="addressLine2" value={address.addressLine2} onChange={handleAddressChange} />

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <div className="col-span-1 md:col-span-2"><FloatingInput label="City" name="city" value={address.city} onChange={handleAddressChange} /></div>
                                            <div className="col-span-1 md:col-span-1"><FloatingInput label="State" name="state" value={address.state} onChange={handleAddressChange} /></div>
                                            <div className="col-span-2 md:col-span-1"><FloatingInput label="PIN" name="pincode" value={address.pincode} onChange={handleAddressChange} /></div>
                                        </div>
                                    </div>
                                </section>

                                <div className="p-6 bg-cyan-50 rounded-3xl border border-cyan-100 flex gap-4">
                                    <ShieldCheck className="text-cyan-600 shrink-0" size={24} />
                                    <p className="text-xs font-bold text-cyan-800 leading-relaxed italic">Your location is used only to assign the nearest delivery associate. We take your privacy seriously.</p>
                                </div>
                            </div>
                        )}

                        {/* 💳 STEP 3: PAYMENT SELECTION */}
                        {step === 'payment' && (
                            <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                                <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
                                    <h2 className="text-xl font-black text-gray-900 border-b border-gray-50 pb-4">Select Payment Method</h2>

                                    <div className="space-y-4">
                                        <PaymentOption
                                            active={paymentMode === 'COD'}
                                            onClick={() => setPaymentMode('COD')}
                                            label="Cash on Delivery"
                                            desc="Safe and reliable. Pay at your doorstep."
                                            icon={<CreditCard className="w-6 h-6" />}
                                        />
                                        <PaymentOption
                                            active={paymentMode === 'ONLINE'}
                                            onClick={() => setPaymentMode('ONLINE')}
                                            label="Online Payment"
                                            desc="Securely pay via UPI, Card, or NetBanking."
                                            badge="PRO"
                                            icon={<CreditCard className="w-6 h-6" />}
                                        />
                                        <PaymentOption
                                            active={paymentMode === 'RM_CREDIT'}
                                            onClick={() => setPaymentMode('RM_CREDIT')}
                                            label="RM Docto Credit"
                                            desc="Use your health points for instant checkout."
                                            badge="SYSTEM"
                                            icon={<CreditCard className="w-6 h-6" />}
                                        />
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* 🧾 STEP 4: SUMMARY */}
                        {step === 'summary' && (
                            <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                                <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-black text-gray-900 mb-6">Order Verification</h2>
                                    <div className="space-y-6">
                                        <SummaryItem label="Deliver To" value={address.fullName} sub={address.addressLine1 + ', ' + address.city} />
                                        <SummaryItem label="Contact" value={"+91 " + address.phone} />
                                        <SummaryItem
                                            label="Payment Mode"
                                            value={paymentMode === 'COD' ? "Cash on Delivery" : paymentMode === 'ONLINE' ? "Online Payment" : "RM Docto Credit"}
                                            icon={<CreditCard size={16} className="text-cyan-600" />}
                                        />
                                    </div>
                                </section>

                                <div className="bg-gray-900 p-8 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400 mb-8 pb-4 border-b border-white/10">Pricing Details</h3>

                                    <div className="space-y-4">
                                        <PriceRow label="Medicine Subtotal" value={subtotal} />
                                        <PriceRow label="GST (Taxes)" value={gstTotal} />
                                        <PriceRow label="Delivery Charges" value={0} free />

                                        <div className="pt-6 border-t border-white/20 mt-6 flex justify-between items-baseline">
                                            <span className="text-lg font-black uppercase tracking-widest text-white/60">Grand Total</span>
                                            <span className="text-4xl font-black text-white tracking-tighter">₹{grandTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Sticky Action Footer */}
            {items.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-2xl border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40">
                    <div className="max-w-3xl mx-auto flex items-center justify-between gap-6">
                        <div className="shrink-0">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Payable</p>
                            <p className="text-3xl font-black text-gray-900 tracking-tighter">₹{grandTotal.toFixed(2)}</p>
                        </div>

                        <button
                            onClick={() => {
                                if (step === 'cart') {
                                    if (!isAuthenticated) {
                                        router.push(`/auth/login?redirect=/medicine-store/cart?step=address`);
                                        return;
                                    }
                                    setStep('address');
                                }
                                else if (step === 'address') setStep('payment');
                                else if (step === 'payment') setStep('summary');
                                else handlePlaceOrder();
                            }}
                            disabled={loading || (step === 'address' && (!address.fullName || !address.phone || !address.addressLine1))}
                            className="flex-1 max-w-xs bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-lg font-black py-4 rounded-[28px] shadow-xl shadow-cyan-100 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            {loading ? "Processing..." : (
                                step === 'cart' ? <>Shipping Details <ChevronRight size={20} /></> :
                                    step === 'address' ? <>Choose Payment <ChevronRight size={20} /></> :
                                        step === 'payment' ? <>Review Order <ChevronRight size={20} /></> :
                                            <>Confirm Order <CheckCircle size={20} /></>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Subcomponents

function PaymentOption({ active, onClick, label, desc, badge, icon }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full p-5 rounded-3xl border-2 text-left transition-all flex items-start gap-4 ${active ? 'border-cyan-600 bg-cyan-50/30' : 'border-gray-50 hover:bg-gray-50 hover:border-gray-100'}`}
        >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${active ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-100' : 'bg-gray-100 text-gray-400'}`}>
                {icon}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-gray-900 leading-none">{label}</span>
                    {badge && <span className="text-[8px] font-black bg-gray-900 text-white px-1.5 py-0.5 rounded-md uppercase tracking-widest">{badge}</span>}
                </div>
                <p className="text-xs text-gray-400 font-bold leading-tight">{desc}</p>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 mt-1 transition-all flex items-center justify-center ${active ? 'border-cyan-600' : 'border-gray-200'}`}>
                {active && <div className="w-3 h-3 rounded-full bg-cyan-600" />}
            </div>
        </button>
    );
}

function FloatingInput({ label, icon, ...props }: any) {
    return (
        <div className="relative group">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">{label}</label>
            <div className="relative">
                {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-600 transition-colors">{icon}</div>}
                <input
                    {...props}
                    className={`w-full bg-gray-50/50 border border-gray-100 text-gray-900 text-sm font-bold rounded-2xl py-3.5 focus:ring-4 focus:ring-cyan-50 focus:border-cyan-200 outline-none transition-all px-4 ${icon ? 'pl-12' : ''}`}
                />
            </div>
        </div>
    );
}

function SummaryItem({ label, value, sub, icon }: any) {
    return (
        <div className="flex gap-4">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300">
                {icon || <CheckCircle size={18} />}
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="font-extrabold text-gray-800 leading-tight">{value}</p>
                {sub && <p className="text-xs text-gray-400 font-medium mt-1">{sub}</p>}
            </div>
        </div>
    );
}

function PriceRow({ label, value, free }: any) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-white/50">{label}</span>
            <span className={`text-sm font-black ${free ? 'text-emerald-400' : 'text-white'}`}>
                {free ? 'FREE' : `₹${value.toFixed(2)}`}
            </span>
        </div>
    );
}

function Pill(props: any) {
    return <div {...props} className="opacity-10"><ShoppingBag /></div>;
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
