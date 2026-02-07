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
  Sparkles
} from "lucide-react";

type MarketingAgentOrder = MarketingAgentOrdersResponse["data"][number];

const STATUS_FILTERS = ["ALL", "INITIATED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

const formatDate = (value: string) => new Date(value).toLocaleDateString();

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
          if (res.meta?.errorStatus === 404) {
            setError("Orders endpoint not found. Please confirm the backend route for marketing agent orders.");
          } else {
            setError(res.meta?.errorMessage || "Failed to load orders");
          }
          return;
        }

        const baseOrders = res.data || [];
        setOrders(baseOrders);
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="relative overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-indigo-50" />
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="relative p-5 sm:p-7 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="w-11 h-11 bg-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-200">
              <Package />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-700">Marketing Agent</p>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Orders Tracker</h1>
              <p className="text-sm text-gray-600 font-medium">Orders assigned to you from agents.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 sm:pb-0">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-gray-100 text-[11px] font-black text-gray-600 whitespace-nowrap">
              <Sparkles size={14} className="text-cyan-600" />
              {orders.length} total orders
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900">Orders</h2>
            <p className="text-sm text-gray-500">Track order status, agent name, and item count.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  activeStatus === status
                    ? "bg-cyan-600 text-white border-cyan-600 shadow-sm shadow-cyan-200"
                    : "bg-white text-gray-700 border-gray-200 hover:border-cyan-200 hover:text-cyan-700"
                }`}
              >
                {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID, medicine, or agent"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-xl mb-4">{error}</div>}
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white h-28 rounded-2xl border border-gray-100 shadow-sm animate-pulse" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-gray-400">No orders found.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5 shadow-[0_16px_32px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                      <Package size={14} />
                      {order.orderId.slice(-6).toUpperCase()}
                    </div>
                    <StatusBadge status={order.orderStatus} />
                  </div>

                  <div className="mt-4 flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center">
                      <Package className="text-gray-200" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 truncate">{order.customer?.name || "Agent"}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} /> {formatDate(order.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CreditCard size={12} /> {order.paymentMode}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Package size={12} /> {order.itemCount ?? 0} items
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                        <User size={14} />
                        <span className="font-semibold truncate">{order.customer?.phone || ""}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</p>
                      <p className="text-lg font-black text-slate-900">₹{order.totalAmount}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Payment {order.paymentStatus}</span>
                    <span>{order.deliveryAddress?.addressLine1 || "Delivery address"}</span>
                  </div>

                  <Link
                    href={`/medicine-store/orders/${order.orderId}`}
                    className="mt-4 inline-flex items-center justify-center w-full rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-cyan-700 hover:bg-cyan-100"
                  >
                    View details
                  </Link>
                </div>
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
