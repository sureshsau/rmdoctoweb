"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/state/AuthContext";
import { agentService } from "@/services/agent.service";
import {
    Users,
    MapPin,
    Target,
    UserPlus,
    TrendingUp,
    ChevronRight,
    Filter,
    Download,
    Calendar,
    Layers,
    Search
} from "lucide-react";

export default function MarketingAgentDashboard() {
    const { user } = useAuthContext();
    const [hierarchy, setHierarchy] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            agentService.getHierarchy(user.id)
                .then((res) => {
                    if (res.success) setHierarchy(res.data);
                })
                .finally(() => setLoading(false));
        }
    }, [user?.id]);

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Top Welcome Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
                        Welcome back, {user?.name?.split(" ")[0]}!
                    </h1>
                    <div className="flex items-center gap-3 mt-3 text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                            <Calendar size={14} className="text-blue-500" />
                            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                            <Layers size={14} className="text-purple-500" />
                            Region: North
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-all">
                        <Download size={18} /> Export
                    </button>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-xl shadow-blue-100 scale-100 hover:scale-105 active:scale-95">
                        <UserPlus size={18} /> Add New Agent
                    </button>
                </div>
            </div>

            {/* Main Grid Components */}
            <div className="grid grid-cols-12 gap-8">

                {/* LEFT COLUMN: Stats and Team */}
                <div className="col-span-12 xl:col-span-8 space-y-8">

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: "Total Network", val: hierarchy?.totalAgents || 0, sub: "+12% from last month", icon: Users, theme: "from-blue-500 to-indigo-600" },
                            { label: "Active Directs", val: hierarchy?.roots?.length || 0, sub: "High performance", icon: Target, theme: "from-purple-500 to-pink-600" },
                            { label: "Target Status", val: "78%", sub: "4 days remaining", icon: TrendingUp, theme: "from-emerald-500 to-teal-600" },
                        ].map((stat, i) => (
                            <div key={i} className="relative overflow-hidden group p-6 bg-white rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-xl">
                                <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-gradient-to-br ${stat.theme} opacity-[0.03] rounded-full`}></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.theme} text-white shadow-lg shadow-gray-100`}>
                                        <stat.icon size={22} />
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</h3>
                                    <div className="flex items-end gap-3 mt-1">
                                        <span className="text-4xl font-extrabold text-gray-900 tracking-tighter">{stat.val}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${i === 2 ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{stat.sub}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Team Directory Area */}
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Active Team Hierarchy</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Manage and monitor your agents connectivity</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                    <input type="text" placeholder="Find agent..." className="pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 w-48 text-gray-900" />
                                </div>
                                <button className="p-2.5 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-xl transition-colors">
                                    <Filter size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="p-4">
                            {loading ? (
                                <div className="p-20 text-center space-y-4">
                                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="text-gray-400 font-medium">Synchronizing Team Data...</p>
                                </div>
                            ) : hierarchy?.roots?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {hierarchy.roots.map((agent: any) => (
                                        <div key={agent._id} className="p-5 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-bold text-gray-900 text-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                    {agent.agentName?.charAt(0) || "A"}
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-gray-900 group-hover:text-blue-700 transition-colors truncate w-32 md:w-full">{agent.agentName}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="flex items-center gap-1 text-[11px] font-bold text-gray-400">
                                                            <MapPin size={10} /> {agent.city || "Unknown"}
                                                        </span>
                                                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                                        <span className="text-[11px] font-extrabold text-emerald-500 bg-emerald-50 px-1.5 rounded uppercase leading-tight">Active</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center">
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                    <Users size={48} className="text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-400 font-bold">No registered agents found yet.</p>
                                    <button className="mt-4 text-sm font-bold text-blue-600 hover:underline">Start Recruiting Agents</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Productivity and Alerts */}
                <div className="col-span-12 xl:col-span-4 space-y-8">

                    {/* High Performance Card */}
                    <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] opacity-60">Performance Leaderboard</h3>
                        <div className="mt-10">
                            <p className="text-5xl font-black tracking-tighter">78<span className="text-xl font-bold opacity-40 ml-1">%</span></p>
                            <p className="mt-2 font-medium opacity-80 italic">Top 15% of agents in your region</p>

                            <div className="mt-10 space-y-3">
                                <div className="h-2 w-full bg-white/10 rounded-full">
                                    <div className="h-full bg-blue-500 w-[78%] rounded-full shadow-[0_0_20px_rgba(59,130,246,0.6)]"></div>
                                </div>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-white/40">
                                    <span>current</span>
                                    <span>Target: 95%</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                                    <TrendingUp size={16} />
                                </div>
                                <p className="text-[12px] font-bold">+INR 4,500 incentive potential</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Notifications */}
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Team Alerts</h3>
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                        </div>

                        <div className="space-y-6">
                            {[
                                { type: "warning", msg: "Agent Rahul missed 2 visits", time: "2h ago", icon: MapPin },
                                { type: "success", msg: "New agent onboarded by Priya", time: "5h ago", icon: UserPlus },
                            ].map((alert, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ${alert.type === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                        <alert.icon size={18} />
                                    </div>
                                    <div className="flex-1 border-b border-gray-50 pb-5">
                                        <p className="text-sm font-bold text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">{alert.msg}</p>
                                        <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{alert.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold text-xs rounded-2xl transition-all uppercase tracking-widest">
                            View All Notifications
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
}
