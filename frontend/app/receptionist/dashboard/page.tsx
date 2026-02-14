"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    Stethoscope,
    ClipboardList,
    ShoppingBag,
    Search,
    Phone,
    Mail
} from "lucide-react";
import { useAuthContext } from "@/state/AuthContext";
import { userService } from "@/services/user.service";
import { orderService, OrderOverview } from "@/services/order.service";
import { AuthUser } from "@/services/auth.service";

const formatAmount = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "—";
    return `₹${value.toFixed(2)}`;
};

export default function ReceptionistDashboard() {
    const { user } = useAuthContext();
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [orders, setOrders] = useState<OrderOverview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userError, setUserError] = useState<string | null>(null);
    const [orderError, setOrderError] = useState<string | null>(null);
    const [orderMeta, setOrderMeta] = useState<{ fallback?: boolean; errorMessage?: string } | null>(null);

    const [userSearch, setUserSearch] = useState("");
    const [doctorSearch, setDoctorSearch] = useState("");
    const [orderSearch, setOrderSearch] = useState("");

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);

            try {
                const [userRes, orderRes] = await Promise.allSettled([
                    userService.getAllUsers(),
                    orderService.getAllOrders()
                ]);

                if (userRes.status === "fulfilled") {
                    if (userRes.value?.success) {
                        setUsers(userRes.value.data || []);
                        setUserError(null);
                    } else {
                        setUserError(userRes.value?.message || "Users permission required");
                    }
                } else {
                    const status = (userRes.reason as any)?.response?.status;
                    setUserError(status === 403 ? "Users permission required" : "Failed to load users");
                }

                if (orderRes.status === "fulfilled") {
                    if (orderRes.value?.success) {
                        setOrders(orderRes.value.data || []);
                        setOrderError(null);
                    } else {
                        setOrderError(orderRes.value?.meta?.errorMessage || "Orders permission required");
                    }
                    setOrderMeta(orderRes.value?.meta ?? null);
                } else {
                    const status = (orderRes.reason as any)?.response?.status;
                    setOrderError(status === 403 ? "Orders permission required" : "Failed to load orders");
                }
            } catch (err) {
                console.error("Failed to load receptionist dashboard", err);
                setError("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const doctors = useMemo(() => {
        return users.filter((u) =>
            u.dashboard === "doctor" || (u.roles || []).some((role) => role === "doctor")
        );
    }, [users]);

    const filteredUsers = useMemo(() => {
        if (!userSearch.trim()) return users;
        const q = userSearch.toLowerCase();
        return users.filter((u) =>
            u.name.toLowerCase().includes(q) ||
            (u.phone || "").includes(q) ||
            (u.email || "").toLowerCase().includes(q)
        );
    }, [users, userSearch]);

    const filteredDoctors = useMemo(() => {
        if (!doctorSearch.trim()) return doctors;
        const q = doctorSearch.toLowerCase();
        return doctors.filter((u) =>
            u.name.toLowerCase().includes(q) ||
            (u.phone || "").includes(q) ||
            (u.email || "").toLowerCase().includes(q)
        );
    }, [doctors, doctorSearch]);

    const filteredOrders = useMemo(() => {
        if (!orderSearch.trim()) return orders;
        const q = orderSearch.toLowerCase();
        return orders.filter((o) =>
            o.orderId.toLowerCase().includes(q) ||
            (o.orderStatus || "").toLowerCase().includes(q) ||
            (o.paymentStatus || "").toLowerCase().includes(q)
        );
    }, [orders, orderSearch]);

    const totalUsers = users.length;
    const totalDoctors = doctors.length;
    const totalOrders = orders.length;

    return (
        <div className="min-w-0 max-w-6xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
            <div className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] border border-gray-100 bg-white shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-rose-50" />
                <div className="absolute -right-24 -top-24 h-52 w-52 sm:h-64 sm:w-64 rounded-full bg-amber-200/30 blur-3xl" />
                <div className="absolute -left-24 -bottom-24 h-52 w-52 sm:h-64 sm:w-64 rounded-full bg-rose-200/30 blur-3xl" />
                <div className="relative p-5 sm:p-8 flex flex-col gap-4 sm:gap-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-600">Reception Desk</p>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">Welcome, {user?.name || "Receptionist"}</h1>
                        <p className="text-sm sm:text-base text-gray-600 font-medium">Manage users, doctors, and order flow from one place.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Users</p>
                            <p className="text-2xl font-black text-gray-900 mt-2">{totalUsers}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Doctors</p>
                            <p className="text-2xl font-black text-gray-900 mt-2">{totalDoctors}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Orders</p>
                            <p className="text-2xl font-black text-gray-900 mt-2">{totalOrders}</p>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-semibold text-red-600">
                    {error}
                </div>
            )}

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-black text-gray-900">Medicine Store</h2>
                            <p className="text-sm text-gray-500">Quick access to browse and place medicine orders.</p>
                        </div>
                        <ShoppingBag className="w-10 h-10 text-amber-500" />
                    </div>
                    <Link
                        href="/medicine-store"
                        className="mt-4 inline-flex items-center justify-center rounded-2xl bg-amber-500 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-amber-100"
                    >
                        Visit Store
                    </Link>
                </div>
                <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-black text-gray-900">Quick Filters</h2>
                    <p className="text-sm text-gray-500">Use search boxes in each section to narrow results.</p>
                </div>
            </section>

            <section id="users" className="bg-white rounded-[24px] sm:rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg sm:text-xl font-black text-gray-900">All Users</h2>
                        <p className="text-sm text-gray-500">Full user list from backend.</p>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            placeholder="Search users"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                </div>
                <div className="p-4 sm:p-6">
                    {userError && (
                        <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                            {userError}
                        </div>
                    )}
                    {loading ? (
                        <div className="py-10 text-center text-gray-400">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="py-10 text-center text-gray-400">No users found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-gray-700">User</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">Contact</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">Dashboard</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">Roles</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredUsers.map((u) => (
                                        <tr key={u._id || u.id || u.identifier || u.name} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                                                        {u.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{u.name}</p>
                                                        <p className="text-xs text-gray-400">{u._id || u.id || u.identifier || ""}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs text-gray-600 flex items-center gap-2">
                                                    <Phone className="w-3 h-3" /> {u.phone || "N/A"}
                                                </div>
                                                <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                                                    <Mail className="w-3 h-3" /> {u.email || "N/A"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-600">
                                                    {u.dashboard || "user"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {(u.roles || []).length > 0 ? (
                                                        (u.roles || []).map((role) => (
                                                            <span
                                                                key={role}
                                                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 uppercase"
                                                            >
                                                                {role}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-400">No roles</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>

            <section id="doctors" className="bg-white rounded-[24px] sm:rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Stethoscope className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-gray-900">Doctors</h2>
                            <p className="text-sm text-gray-500">Book a doctor from the list below.</p>
                        </div>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input
                            value={doctorSearch}
                            onChange={(e) => setDoctorSearch(e.target.value)}
                            placeholder="Search doctors"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>
                <div className="p-4 sm:p-6">
                    {loading ? (
                        <div className="py-10 text-center text-gray-400">Loading doctors...</div>
                    ) : filteredDoctors.length === 0 ? (
                        <div className="py-10 text-center text-gray-400">No doctors found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-gray-700">Doctor</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">Contact</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredDoctors.map((doc) => {
                                        const docId = doc._id || doc.id || doc.identifier || "";
                                        return (
                                            <tr key={docId || doc.name} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                                            {doc.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{doc.name}</p>
                                                            <p className="text-xs text-gray-400">{doc.email || "No email"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-xs text-gray-600 flex items-center gap-2">
                                                        <Phone className="w-3 h-3" /> {doc.phone || "N/A"}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={`/contact?doctorId=${encodeURIComponent(docId)}&doctorName=${encodeURIComponent(doc.name)}`}
                                                        className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-100"
                                                    >
                                                        Book Doctor
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>

            <section id="orders" className="bg-white rounded-[24px] sm:rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                            <ClipboardList className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-gray-900">Orders</h2>
                            <p className="text-sm text-gray-500">Recent medicine orders and payment status.</p>
                        </div>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input
                            value={orderSearch}
                            onChange={(e) => setOrderSearch(e.target.value)}
                            placeholder="Search orders"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                </div>

                {orderMeta?.fallback && (
                    <div className="mx-4 sm:mx-6 mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                        Showing limited order data. {orderMeta.errorMessage ? `(${orderMeta.errorMessage})` : ""}
                    </div>
                )}

                <div className="p-4 sm:p-6">
                    {orderError && (
                        <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                            {orderError}
                        </div>
                    )}
                    {loading ? (
                        <div className="py-10 text-center text-gray-400">Loading orders...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="py-10 text-center text-gray-400">No orders found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-gray-700">Order</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">Payment</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">Total</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">Placed</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredOrders.map((order) => (
                                        <tr key={order.orderId} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-gray-900">#{order.orderId}</p>
                                                <p className="text-xs text-gray-400">{order.medicine?.name || "Medicine order"}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-cyan-50 text-cyan-700">
                                                    {order.orderStatus}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-600">
                                                    {order.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-gray-900">
                                                {formatAmount(order.payableAmount)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {new Date(order.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
