"use client";

import { JSX, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { orderService, OrderOverview } from "@/services/order.service";
import {
  ArrowLeft,
  Package,
  Clock,
  CreditCard,
  ChevronRight,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Filter,
  ShieldCheck,
  X,
  Sparkles,
  BarChart3
} from "lucide-react";

const STATUS_FILTERS = ["ALL", "INITIATED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function AgentOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("ALL");

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

  const filteredOrders = useMemo(() => {
    const sorted = [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return activeStatus === "ALL" ? sorted : sorted.filter((o) => o.orderStatus === activeStatus);
  }, [orders, activeStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 pb-16">
      <div className="px-4 md:px-10 pt-8 pb-6 flex flex-col gap-6 bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2.5 rounded-2xl border border-gray-100 text-gray-600 hover:bg-gray-50 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-[11px] font-black uppercase tracking-[0.18em]">
                <Sparkles className="w-3.5 h-3.5" /> Agent channel
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">My Orders</h1>
              <p className="text-gray-500 font-medium text-sm">Latest medicine orders with quick filters.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-2xl bg-gray-50 text-gray-600 text-sm font-semibold">
              <BarChart3 className="w-4 h-4 text-cyan-600" /> {orders.length || 0} orders
            </div>
            <Link
              href="/medicine-store"
              className="inline-flex items-center gap-2 px-4 py-3 bg-cyan-600 text-white rounded-2xl font-bold shadow-lg shadow-cyan-100 hover:bg-cyan-700 transition-all"
            >
              <ShoppingBag size={18} />
              Order Medicine
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500">
            <Filter size={14} />
            Status
          </div>
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all border backdrop-blur ${
                activeStatus === status
                  ? "bg-cyan-600 text-white border-cyan-600 shadow-sm shadow-cyan-200"
                  : "bg-white/70 text-gray-700 border-gray-200 hover:border-cyan-200 hover:text-cyan-700"
              }`}
            >
              {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white h-36 rounded-3xl border border-gray-100 shadow-sm animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[32px] border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-[28px] flex items-center justify-center mb-6 text-gray-200">
              <Package size={32} />
            </div>
            <h2 className="text-xl font-black text-gray-900">No orders found</h2>
            <p className="text-gray-400 mt-2 font-medium max-w-sm">Orders placed from the medicine store will show up here.</p>
            <Link href="/medicine-store" className="mt-8 px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200">
              Go to Store
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOrders.map((order) => (
              <div
                key={order.orderId}
                className="bg-white rounded-[28px] border border-gray-100 shadow-lg shadow-gray-100/40 overflow-hidden group hover:border-cyan-100 transition-all"
              >
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-cyan-600">
                      <Package size={16} />
                    </div>
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">ID: {order.orderId.slice(-6).toUpperCase()}</span>
                  </div>
                  <StatusBadge status={order.orderStatus} />
                </div>

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
                      {order.medicine?.name || "Medicines"}
                      {order.medicine && order.medicine.quantity > 1 && (
                        <span className="ml-2 text-xs text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-lg">+{order.medicine.quantity - 1} more</span>
                      )}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-black tracking-widest uppercase text-gray-400 pt-1">
                      <div className="flex items-center gap-1"><Clock size={12} /> {new Date(order.createdAt).toLocaleDateString()}</div>
                      <div className="flex items-center gap-1"><CreditCard size={12} /> {order.paymentMode}</div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payable</p>
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

                <Link
                  href={`/medicine-store/orders/${order.orderId}`}
                  className="px-6 py-4 border-t border-gray-50 flex items-center justify-between text-xs font-black uppercase tracking-widest text-cyan-600 hover:bg-cyan-50/60 transition-colors"
                >
                  <span>View details</span>
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
  const config: Record<string, { bg: string; text: string; icon: JSX.Element }> = {
    INITIATED: { bg: "bg-blue-50", text: "text-blue-600", icon: <Clock size={12} /> },
    CONFIRMED: { bg: "bg-emerald-50", text: "text-emerald-600", icon: <CheckCircle2 size={12} /> },
    SHIPPED: { bg: "bg-orange-50", text: "text-orange-600", icon: <Truck size={12} /> },
    DELIVERED: { bg: "bg-gray-100", text: "text-gray-900", icon: <CheckCircle2 size={12} /> },
    CANCELLED: { bg: "bg-red-50", text: "text-red-600", icon: <X size={12} /> }
  };

  const style = config[status] || config.INITIATED;

  return (
    <div className={`${style.bg} ${style.text} px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5`}>
      {style.icon}
      {status}
    </div>
  );
}
