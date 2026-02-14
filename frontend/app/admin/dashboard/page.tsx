"use client";

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    HeartPulse,
    Package,
    ShieldCheck,
    ShoppingBag,
    Stethoscope,
    TrendingUp,
    Users
} from "lucide-react";
import { userService } from "@/services/user.service";
import { orderService, type OrderOverview } from "@/services/order.service";
import { roleService, type Role } from "@/services/role.service";
import { type AuthUser } from "@/services/auth.service";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

type DashboardState = {
    users: AuthUser[];
    orders: OrderOverview[];
    roles: Role[];
};

export default function AdminDashboardPage() {
    const [data, setData] = useState<DashboardState>({ users: [], orders: [], roles: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [usersRes, ordersRes, rolesRes] = await Promise.all([
                    userService.getAllUsers(),
                    orderService.getAllOrders({ limit: 25 }),
                    roleService.getAllRoles()
                ]);

                setData({
                    users: usersRes.success ? usersRes.data : [],
                    orders: ordersRes.success ? ordersRes.data : [],
                    roles: rolesRes.success ? rolesRes.data : []
                });
            } catch (err) {
                setError(getApiErrorMessage(err));
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const metrics = useMemo(() => {
        const { users, orders } = data;
        const totalUsers = users.length;
        const active = users.filter((u) => (u as any).isActive).length;
        const doctors = users.filter((u) => u.roles?.includes("doctor") || u.dashboard === "doctor").length;
        const agents = users.filter((u) => u.roles?.includes("agent") || u.dashboard === "agent").length;

        const orderCounts = orders.reduce(
            (acc, order) => {
                acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );

        const delivered = orders.filter((o) => o.orderStatus === "DELIVERED");
        const pending = orders.filter((o) => o.orderStatus !== "DELIVERED" && o.orderStatus !== "CANCELLED");
        const revenue = delivered.reduce((sum, o) => sum + (o.payableAmount || 0), 0);
        const averageOrder = orders.length ? revenue / orders.length : 0;

        return {
            totalUsers,
            active,
            doctors,
            agents,
            pendingOrders: pending.length,
            deliveredOrders: delivered.length,
            revenue,
            averageOrder,
            orderCounts
        };
    }, [data]);

    const recentOrders = useMemo(
        () => [...data.orders]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 6),
        [data.orders]
    );

    return (
        <div className="min-w-0 max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-600">Hospital Operations</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight truncate">Admin Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">Overview of users, orders, and system health.</p>
                </div>
                <div className="flex items-center gap-3 app-card px-4 py-3 shrink-0">
                    <ShieldCheck className="text-teal-500" size={18} />
                    <span className="text-sm font-medium text-slate-700">System healthy</span>
                    <span className="text-xs font-medium text-slate-400">{new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
            </header>

            {error && (
                <div className="app-card border-red-200 bg-red-50 text-red-700 rounded-xl p-4 text-sm font-medium">
                    {error}
                </div>
            )}

            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                    title="Total Users"
                    value={metrics.totalUsers}
                    deltaLabel="Active"
                    deltaValue={metrics.active}
                    icon={Users}
                    accent="from-blue-500 to-indigo-600"
                    loading={loading}
                />
                <StatCard
                    title="Doctors"
                    value={metrics.doctors}
                    deltaLabel="Agents"
                    deltaValue={metrics.agents}
                    icon={Stethoscope}
                    accent="from-emerald-500 to-teal-500"
                    loading={loading}
                />
                <StatCard
                    title="Open Orders"
                    value={metrics.pendingOrders}
                    deltaLabel="Delivered"
                    deltaValue={metrics.deliveredOrders}
                    icon={ShoppingBag}
                    accent="from-orange-500 to-rose-500"
                    loading={loading}
                />
                <StatCard
                    title="Net Revenue"
                    value={`₹${metrics.revenue.toLocaleString()}`}
                    deltaLabel="Avg order"
                    deltaValue={`₹${metrics.averageOrder.toFixed(0)}`}
                    icon={TrendingUp}
                    accent="from-purple-500 to-cyan-500"
                    loading={loading}
                />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                <div className="app-card rounded-2xl p-4 sm:p-6 xl:col-span-2 min-w-0">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Order Flow</p>
                            <h2 className="text-xl font-black text-gray-900">Recent orders</h2>
                        </div>
                        <a href="/admin/orders" className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                            View all <ArrowUpRight size={16} />
                        </a>
                    </div>

                    <div className="overflow-x-auto min-w-0">
                        <table className="w-full text-sm min-w-[400px]">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50">
                                    <th className="py-3 text-left">Order</th>
                                    <th className="py-3 text-left">Payment</th>
                                    <th className="py-3 text-left">Status</th>
                                    <th className="py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="py-4" colSpan={4}>
                                                <div className="h-3 bg-gray-50 rounded" />
                                            </td>
                                        </tr>
                                    ))
                                ) : recentOrders.length === 0 ? (
                                    <tr>
                                        <td className="py-6 text-center text-gray-500" colSpan={4}>
                                            No orders yet.
                                        </td>
                                    </tr>
                                ) : (
                                    recentOrders.map((order) => (
                                        <tr key={order.orderId} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-3">
                                                <div className="font-black text-gray-900">#{order.orderId.slice(-6).toUpperCase()}</div>
                                                <div className="text-xs text-gray-400 font-bold">
                                                    {new Date(order.createdAt).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="py-3 text-xs font-black uppercase tracking-wider text-gray-500">
                                                {order.paymentStatus}
                                                <span className="text-[10px] text-gray-400 ml-2">{order.paymentMode}</span>
                                            </td>
                                            <td className="py-3">
                                                <StatusPill status={order.orderStatus} />
                                            </td>
                                            <td className="py-3 text-right font-black text-gray-900">
                                                ₹{order.payableAmount.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black text-gray-900">Role coverage</h3>
                            <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Roles</span>
                        </div>
                        <div className="space-y-3">
                            {loading ? (
                                [...Array(4)].map((_, i) => (
                                    <div key={i} className="h-10 bg-gray-50 rounded-xl animate-pulse" />
                                ))
                            ) : data.roles.length === 0 ? (
                                <p className="text-sm text-gray-500">No roles configured.</p>
                            ) : (
                                data.roles.slice(0, 5).map((role) => {
                                    const count = data.users.filter((u) => u.roles?.includes(role.key)).length;
                                    return (
                                        <div key={role._id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50">
                                            <div>
                                                <p className="font-bold text-gray-900">{role.name}</p>
                                                <p className="text-[11px] text-gray-500 uppercase tracking-widest">{role.key}</p>
                                            </div>
                                            <span className="text-sm font-black text-cyan-700">{count}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-900 text-white rounded-3xl shadow-xl p-6 space-y-4 relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl" />
                        <div className="flex items-center gap-2">
                            <HeartPulse size={18} className="text-cyan-300" />
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-white/70">System health</p>
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-4xl font-black leading-tight">{metrics.pendingOrders === 0 ? "Stable" : "Active"}</p>
                                <p className="text-sm text-white/60">Monitoring orders & user signals</p>
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-2xl text-sm font-bold">
                                <Clock size={16} /> Live
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 pt-2 text-sm">
                            <HealthStat label="Pending" value={metrics.pendingOrders} />
                            <HealthStat label="Delivered" value={metrics.deliveredOrders} />
                            <HealthStat label="Active users" value={metrics.active} />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function StatCard({ title, value, deltaLabel, deltaValue, icon: Icon, accent, loading }: {
    title: string;
    value: number | string;
    deltaLabel: string;
    deltaValue: number | string;
    icon: ComponentType<{ size?: number }>;
    accent: string;
    loading: boolean;
}) {
    return (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5">
            {loading ? (
                <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-gray-50 rounded" />
                    <div className="h-6 bg-gray-50 rounded w-2/3" />
                    <div className="h-3 bg-gray-50 rounded w-1/2" />
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-500">{title}</p>
                        <span className={`p-3 rounded-2xl bg-gradient-to-br ${accent} text-white shadow-sm`}>
                            <Icon size={18} />
                        </span>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <p className="text-3xl font-black text-gray-900 tracking-tight">{value}</p>
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                            <ArrowUpRight size={12} />
                            {deltaLabel}: {deltaValue}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const styleMap: Record<string, { bg: string; text: string; icon: ReactNode }> = {
        DELIVERED: { bg: "bg-emerald-50 text-emerald-700 border-emerald-100", text: "Delivered", icon: <CheckCircle2 size={14} /> },
        SHIPPED: { bg: "bg-blue-50 text-blue-700 border-blue-100", text: "Shipped", icon: <Package size={14} /> },
        CONFIRMED: { bg: "bg-cyan-50 text-cyan-700 border-cyan-100", text: "Confirmed", icon: <ShieldCheck size={14} /> },
        INITIATED: { bg: "bg-gray-100 text-gray-700 border-gray-200", text: "Initiated", icon: <Clock size={14} /> },
        CANCELLED: { bg: "bg-red-50 text-red-700 border-red-100", text: "Cancelled", icon: <AlertTriangle size={14} /> }
    };

    const style = styleMap[status] || styleMap.INITIATED;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest border ${style.bg}`}>
            {style.icon}
            {style.text}
        </span>
    );
}

function HealthStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/10">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">{label}</p>
            <p className="text-xl font-black">{value}</p>
        </div>
    );
}
