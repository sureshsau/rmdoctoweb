"use client";

import React, { JSX, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { orderService, type MarketingAgentOrdersResponse } from "@/services/order.service";
import {
  Search,
  Package,
  Clock,
  CreditCard,
  CheckCircle2,
  Truck,
  X,
  User,
  Sparkles,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

type MarketingAgentOrder = MarketingAgentOrdersResponse["data"][number];

const STATUS_FILTERS = ["ALL", "INITIATED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function MarketingAgentOrdersPage() {
  const [orders, setOrders] = useState<MarketingAgentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("ALL");

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await orderService.getMarketingAgentOrders();
        if (!res.success) {
          setOrders([]);
          setError(res.meta?.errorMessage || "Failed to load orders");
          return;
        }
        setOrders(res.data || []);
      } catch (err) {
        console.error("Failed to load orders", err);
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = activeStatus === "ALL" || order.orderStatus === activeStatus;
      const matchesSearch =
        !q ||
        order.orderId.toLowerCase().includes(q) ||
        (order.customer?.name || "").toLowerCase().includes(q) ||
        (order.customer?.phone || "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [orders, activeStatus, search]);

  return (
    <div className="py-6 sm:py-8 space-y-6 sm:space-y-8 pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-100 bg-white shadow-sm shadow-slate-200/50">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50/80" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-200/25 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-cyan-200/20 blur-3xl" />
        <div className="relative p-5 sm:p-8 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
                <Package className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">Marketing Agent</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">Orders</h1>
                <p className="text-sm text-slate-600 mt-1">Orders assigned to you from agents.</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-sm font-semibold text-indigo-700 shrink-0">
              <Sparkles className="w-4 h-4 shrink-0" />
              {orders.length} total
            </div>
          </div>
        </div>
      </section>

      {/* Filters & list */}
      <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Order list</h2>
            <p className="text-sm text-slate-500 mt-0.5">Filter by status and search.</p>
          </div>

          {/* Status pills - horizontal scroll on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border min-h-[44px]
                  ${activeStatus === status
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-700 active:bg-slate-50"
                  }`}
              >
                {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID, customer, or phone..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-36 sm:h-40 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No orders found</h3>
              <p className="text-sm text-slate-500 mt-1">Try a different filter or search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredOrders.map((order) => (
                <Link
                  key={order.orderId}
                  href={`/marketing-agent/orders/${order.orderId}`}
                  className="group block rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-lg hover:border-indigo-200/60 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-0">
                      <Package className="w-4 h-4 shrink-0 text-slate-400" />
                      <span className="truncate">#{order.orderId.slice(-8).toUpperCase()}</span>
                    </div>
                    <StatusBadge status={order.orderStatus} />
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{order.customer?.name || "Customer"}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {formatDate(order.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5" /> {order.paymentMode}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" /> {order.itemCount ?? 0} items
                        </span>
                      </div>
                      {order.customer?.phone && (
                        <p className="mt-1.5 text-sm text-slate-600 flex items-center gap-1.5 truncate">
                          <User className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          {order.customer.phone}
                        </p>
                      )}
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
                      <p className="text-lg font-bold text-slate-900">₹{order.totalAmount}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 truncate">
                      {order.deliveryAddress?.addressLine1 || "Delivery address"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:gap-1.5 transition-all">
                      View details <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: JSX.Element }> = {
    INITIATED: { bg: "bg-blue-50", text: "text-blue-700", icon: <Clock size={12} /> },
    CONFIRMED: { bg: "bg-emerald-50", text: "text-emerald-700", icon: <CheckCircle2 size={12} /> },
    SHIPPED: { bg: "bg-amber-50", text: "text-amber-700", icon: <Truck size={12} /> },
    DELIVERED: { bg: "bg-slate-100", text: "text-slate-800", icon: <CheckCircle2 size={12} /> },
    CANCELLED: { bg: "bg-red-50", text: "text-red-700", icon: <X size={12} /> },
  };
  const style = config[status] || config.INITIATED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text}`}>
      {style.icon}
      {status}
    </span>
  );
}
