"use client";

import { useEffect, useState } from "react";
import { orderService, OrderOverview } from "@/services/order.service";
import {
    ShoppingBag,
    Search,
    Filter,
    Eye,
    ArrowRight,
    Clock,
    CheckCircle2,
    Truck,
    XCircle,
    Package
} from "lucide-react";
import Link from "next/link";

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<OrderOverview[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");

    useEffect(() => {
        async function fetchOrders() {
            setLoading(true);
            try {
                console.log('📦 Fetching orders with filter:', statusFilter);
                const res = await orderService.getAllOrders(statusFilter ? { orderStatus: statusFilter } : {});
                console.log('📦 Response:', res);
                if (res.success) {
                    console.log('📦 Orders data:', res.data);
                    console.log('📦 Number of orders:', res.data?.length);
                    setOrders(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch orders", err);
            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, [statusFilter]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "DELIVERED": return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case "CANCELLED": return "bg-red-50 text-red-600 border-red-100";
            case "SHIPPED": return "bg-blue-50 text-blue-600 border-blue-100";
            case "CONFIRMED": return "bg-cyan-50 text-cyan-600 border-cyan-100";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "DELIVERED": return <CheckCircle2 size={14} />;
            case "CANCELLED": return <XCircle size={14} />;
            case "SHIPPED": return <Truck size={14} />;
            case "CONFIRMED": return <Package size={14} />;
            default: return <Clock size={14} />;
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Order Management</h1>
                    <p className="text-gray-500 font-medium mt-1">Review and manage all medicine orders from across the platform.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-cyan-600 transition-colors" size={18} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-12 pr-10 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm appearance-none focus:ring-2 focus:ring-cyan-500 outline-none font-bold text-sm text-gray-700 transition-all cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            <option value="INITIATED">Initiated</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                <th className="px-8 py-6">Order ID</th>
                                <th className="px-6 py-6">Date</th>
                                <th className="px-6 py-6">Status</th>
                                <th className="px-6 py-6">Payment</th>
                                <th className="px-6 py-6">Total</th>
                                <th className="px-8 py-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-8 py-6">
                                            <div className="h-4 bg-gray-50 rounded-lg w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-3xl mx-auto flex items-center justify-center mb-4">
                                            <ShoppingBag className="text-gray-200" size={32} />
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900">No orders found</h3>
                                        <p className="text-gray-500 font-medium">Try changing your filters or check back later.</p>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.orderId} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <span className="font-black text-gray-900 tracking-tight">#{order.orderId.slice(-6).toUpperCase()}</span>
                                        </td>
                                        <td className="px-6 py-6 text-sm font-bold text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider ${getStatusStyle(order.orderStatus)}`}>
                                                {getStatusIcon(order.orderStatus)}
                                                {order.orderStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <p className={`text-[10px] font-black uppercase tracking-wider ${order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-orange-500'}`}>
                                                {order.paymentStatus}
                                            </p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{order.paymentMode}</p>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="text-base font-black text-gray-900 tracking-tight">₹{order.payableAmount.toFixed(2)}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Link
                                                href={`/medicine-store/orders/${order.orderId}`}
                                                className="inline-flex items-center justify-center w-10 h-10 bg-gray-50 text-gray-400 rounded-xl hover:bg-cyan-600 hover:text-white hover:shadow-lg transition-all"
                                            >
                                                <Eye size={18} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
