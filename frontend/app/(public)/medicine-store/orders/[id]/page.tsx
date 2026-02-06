"use client";

import { useEffect, useState } from "react";
import { orderService, OrderDetails } from "@/services/order.service";
import { ArrowLeft, Package, Clock, CheckCircle2, ShoppingBag, Truck, MapPin, Smartphone, User, CreditCard, ShieldCheck } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export default function OrderDetailsPage() {
    const router = useRouter();
    const { id } = useParams();
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        const fetchDetails = async () => {
            try {
                const res = await orderService.getOrderDetails(id as string);
                if (res.success) {
                    setOrder(res.data);
                }
            } catch (err) {
                const message = (err as any)?.response?.data?.message || (err as any)?.message;
                console.error("Failed to load order details:", err);
                setError(message || "Failed to load order details");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-cyan-100 border-t-cyan-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                    <Package className="text-gray-200 w-10 h-10" />
                </div>
                <h1 className="text-2xl font-black text-gray-900">Order not found</h1>
                {error && <p className="mt-2 text-sm text-red-500 font-semibold">{error}</p>}
                <button onClick={() => router.back()} className="mt-6 text-cyan-600 font-bold uppercase tracking-widest text-xs">Go Back</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-30 px-4 py-4 border-b border-gray-100 shadow-sm flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2.5 hover:bg-gray-50 rounded-2xl text-gray-600 transition-all border border-transparent hover:border-gray-100"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight">Order #{order.orderId.slice(-6).toUpperCase()}</h1>
                    <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest leading-none mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
                {/* 🔑 PIN SECTION (Strictly for Owner/Admin) */}
                {order.otp && !order.otpVerified && (
                    <section className="bg-gray-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-cyan-900/20 animate-in zoom-in duration-500">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full -mr-24 -mt-24 blur-3xl opacity-50" />
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                                <ShieldCheck className="text-cyan-400" />
                            </div>
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400 mb-2">Delivery Verification PIN</h2>
                            <div className="flex gap-2 my-4">
                                {String(order.otp).split('').map((char, i) => (
                                    <div key={i} className="w-12 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl font-black border border-white/20 backdrop-blur-xl shadow-inner">
                                        {char}
                                    </div>
                                ))}
                            </div>
                            <p className="text-white/50 text-[10px] font-bold max-w-[200px] leading-relaxed">Give this PIN to the delivery partner only after you receive your medicines.</p>
                        </div>
                    </section>
                )}

                {/* Tracking Timeline */}
                <section className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-8 border-b border-gray-50 pb-4">Live Tracking</h3>
                    <div className="relative space-y-12">
                        {/* Vertical Line */}
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-50" />

                        <TimelineItem
                            active={true}
                            icon={<Package size={16} />}
                            title="Order Initiated"
                            desc="We've received your request and a pharmacist is reviewing it."
                            time={new Date(order.createdAt).toLocaleTimeString()}
                        />
                        <TimelineItem
                            active={['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.orderStatus)}
                            icon={<CheckCircle2 size={16} />}
                            title="Confirmed"
                            desc="Medicines picked and quality checked."
                        />
                        <TimelineItem
                            active={['SHIPPED', 'DELIVERED'].includes(order.orderStatus)}
                            icon={<Truck size={16} />}
                            title="Out for Delivery"
                            desc={order.deliveryAgent ? `${order.deliveryAgent.name} is on the way` : "Waiting for delivery associate assignment."}
                        />
                        <TimelineItem
                            active={order.orderStatus === 'DELIVERED'}
                            icon={<ShoppingBag size={16} />}
                            title="Handed Over"
                            desc="Package delivered safely."
                        />
                    </div>
                </section>

                {/* Items */}
                <section className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 pb-4 border-b border-gray-50">Medicines Ordered</h3>
                    <div className="space-y-6">
                        {order.items.map((item, i) => (
                            <div key={i} className="flex gap-4 items-center group">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 p-2 shrink-0">
                                    {item.medicine.image && <img src={item.medicine.image} alt="" className="w-full h-full object-contain mix-blend-multiply" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-gray-900 leading-tight truncate">{item.medicine.name}</h4>
                                    <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mt-0.5">{item.medicine.brandName} • {item.medicine.dosageForm}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-black text-gray-900">₹{item.totalPrice}</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">{item.quantity} Unit{item.quantity > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 pt-8 border-t border-gray-50 space-y-4">
                        <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                            <span>Subtotal</span>
                            <span>₹{order.pricing.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                            <span>GST (Healthcare)</span>
                            <span>₹{order.pricing.gstTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                            <span>Delivery Charge</span>
                            <span>₹{order.pricing.deliveryCharge.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 px-6 py-4 rounded-3xl mt-4">
                            <span className="text-sm font-black uppercase tracking-widest text-gray-900">Grand Total</span>
                            <span className="text-xl font-black text-cyan-600 tracking-tight">₹{order.pricing.payableAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </section>

                {/* Address & Delivery Agent */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50 pb-4">Delivery Address</h3>
                        <div className="flex gap-3 items-start pt-2">
                            <MapPin size={20} className="text-cyan-600 shrink-0" />
                            <div>
                                <p className="text-sm font-black text-gray-900">{order.deliveryAddress.fullName}</p>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">
                                    {order.deliveryAddress.addressLine1}
                                    {order.deliveryAddress.addressLine2 && `, ${order.deliveryAddress.addressLine2}`}
                                    {order.deliveryAddress.city && `, ${order.deliveryAddress.city}`}
                                    {order.deliveryAddress.state && `, ${order.deliveryAddress.state}`}
                                    {" "} - {order.deliveryAddress.pincode}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50 pb-4">Associate Contact</h3>
                        {order.deliveryAgent ? (
                            <div className="flex gap-3 items-center pt-2">
                                <User size={20} className="text-cyan-600 shrink-0" />
                                <div>
                                    <p className="text-sm font-black text-gray-900">{order.deliveryAgent.name}</p>
                                    <div className="flex items-center gap-1.5 text-xs text-cyan-600 font-black mt-1">
                                        <Smartphone size={12} /> {order.deliveryAgent.phone}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 font-medium leading-relaxed pt-2">Waiting for pharmacist to assign a delivery associate.</p>
                        )}
                    </div>
                </div>

                <div className="bg-cyan-600/5 p-8 rounded-[40px] border border-cyan-100/50 flex gap-5 items-start">
                    <div className="w-10 h-10 bg-cyan-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-cyan-200">
                        <CreditCard className="text-white" size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-cyan-900">Payment Status</p>
                        <p className="text-[10px] font-black text-cyan-600 bg-white border border-cyan-100 w-max px-2 py-0.5 rounded-lg mt-1 mb-2">MODE: {order.paymentMode}</p>
                        <h4 className="text-lg font-black text-cyan-950 tracking-tight">{order.paymentStatus}</h4>
                        <p className="text-xs text-cyan-700 font-medium mt-1 leading-relaxed">
                            {order.paymentMode === 'COD'
                                ? "Cash will be collected at the time of delivery."
                                : "Payment has been processed securely through our system."}
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

function TimelineItem({ active, icon, title, desc, time }: any) {
    return (
        <div className={`relative flex gap-6 px-1 transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-20'}`}>
            <div className={`w-8 h-8 rounded-xl z-10 flex items-center justify-center shrink-0 border-2 transition-all ${active ? 'bg-cyan-600 text-white border-cyan-600 shadow-lg shadow-cyan-100 scale-110' : 'bg-white text-gray-300 border-gray-100'}`}>
                {icon}
            </div>
            <div className="flex-1 space-y-1">
                <div className="flex justify-between items-baseline">
                    <h4 className="font-black text-gray-900 leading-none">{title}</h4>
                    {time && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{time}</span>}
                </div>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}
