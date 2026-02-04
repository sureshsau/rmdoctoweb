"use client";

import { useEffect, useState } from "react";
import { orderService, OrderOverview } from "@/services/order.service";
import { ArrowLeft, Package, Clock, CheckCircle2, ChevronRight, ShoppingBag, Truck, CreditCard, Search, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MyOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderOverview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await orderService.getMyOrders();
                if (res.success) {
                    setOrders(res.data);
                }
            } catch (err) {
                console.error("Failed to load orders:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-30 px-4 py-4 border-b border-gray-100 shadow-sm flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2.5 hover:bg-gray-50 rounded-2xl text-gray-600 transition-all border border-transparent hover:border-gray-100"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight">Order History</h1>
                    <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest leading-none mt-0.5">Track your health deliveries</p>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-4 md:p-8">
                {loading ? (
                    <div className="space-y-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white h-48 rounded-[32px] border border-gray-100 shadow-sm animate-pulse" />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-24 h-24 bg-white rounded-[40px] shadow-sm flex items-center justify-center mb-8 border border-gray-50">
                            <Package className="w-10 h-10 text-gray-200" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900">No orders yet</h2>
                        <p className="text-gray-400 mt-2 font-medium max-w-xs">Your medicine orders will appear here once you place them.</p>
                        <Link href="/medicine-store" className="mt-8 px-10 py-3.5 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl shadow-gray-200">
                            Order Medicines
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.orderId} className="bg-white rounded-[32px] border border-gray-100 shadow-lg shadow-gray-100/50 overflow-hidden group hover:border-cyan-100 transition-all active:scale-[0.99]">
                                {/* Card Header */}
                                <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-cyan-600">
                                            <Package size={16} />
                                        </div>
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">ID: {order.orderId.slice(-6).toUpperCase()}</span>
                                    </div>
                                    <StatusBadge status={order.orderStatus} />
                                </div>

                                {/* Content */}
                                <div className="p-6 flex gap-5">
                                    <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100 p-2">
                                        {order.medicine?.image ? (
                                            <img src={order.medicine.image} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                                        ) : (
                                            <ShoppingBag className="text-gray-200" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <h3 className="font-black text-gray-900 leading-tight">
                                            {order.medicine?.name}
                                            {order.medicine && order.medicine.quantity > 1 && (
                                                <span className="ml-2 text-xs text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-lg">+{order.medicine.quantity - 1} more</span>
                                            )}
                                        </h3>
                                        <div className="flex items-center gap-4 text-[10px] font-black tracking-widest uppercase text-gray-400 pt-1">
                                            <div className="flex items-center gap-1"><Clock size={12} /> {new Date(order.createdAt).toLocaleDateString()}</div>
                                            <div className="flex items-center gap-1"><CreditCard size={12} /> {order.paymentMode}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Payable</p>
                                        <p className="text-xl font-black text-gray-900 tracking-tight">₹{order.payableAmount}</p>
                                        {order.otp && (
                                            <div className="mt-2 flex items-center justify-end gap-1.5">
                                                <span className="text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-1 rounded-lg border border-cyan-100 flex items-center gap-1">
                                                    <ShieldCheck size={10} /> PIN: {order.otp}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Link */}
                                <Link
                                    href={`/medicine-store/orders/${order.orderId}`}
                                    className="px-6 py-4 border-t border-gray-50 flex items-center justify-between text-xs font-black uppercase tracking-widest text-cyan-600 hover:bg-cyan-50/50 transition-colors"
                                >
                                    <span>View Details & Order Pin</span>
                                    <ChevronRight size={14} />
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string, text: string, icon: any }> = {
        INITIATED: { bg: 'bg-blue-50', text: 'text-blue-600', icon: <Clock size={12} /> },
        CONFIRMED: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <CheckCircle2 size={12} /> },
        SHIPPED: { bg: 'bg-orange-50', text: 'text-orange-600', icon: <Truck size={12} /> },
        DELIVERED: { bg: 'bg-gray-100', text: 'text-gray-900', icon: <CheckCircle2 size={12} /> },
        CANCELLED: { bg: 'bg-red-50', text: 'text-red-600', icon: <X size={12} /> },
    };

    const style = config[status] || config.INITIATED;

    return (
        <div className={`${style.bg} ${style.text} px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5`}>
            {style.icon}
            {status}
        </div>
    );
}

function X(props: any) {
    return <div {...props} className="w-3 h-3 border-2 border-current rounded-full" />;
}
