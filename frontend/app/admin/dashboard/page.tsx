"use client";

import { useEffect, useState } from "react";
import { Users, Stethoscope, UserCheck, Activity } from "lucide-react";
import { userService } from "@/services/user.service";
import { AuthUser } from "@/services/auth.service"; // Ensure this type is exported

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        doctors: 0,
        patients: 0,
        active: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const data = await userService.getAllUsers();
                if (data.success && Array.isArray(data.data)) {
                    const users = data.data;
                    setStats({
                        totalUsers: users.length,
                        doctors: users.filter((u) => u.roles?.includes("doctor") || u.dashboard === "doctor").length,
                        patients: users.filter((u) => u.dashboard === "patient" || u.dashboard === "user").length,
                        active: users.filter((u) => (u as any).isActive).length, // backend sends isActive
                    });
                }
            } catch (err) {
                console.error("Failed to fetch admin stats", err);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    const statCards = [
        { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-blue-500" },
        { label: "Doctors", value: stats.doctors, icon: Stethoscope, color: "bg-teal-500" },
        { label: "Patients", value: stats.patients, icon: UserCheck, color: "bg-indigo-500" },
        { label: "Active Accounts", value: stats.active, icon: Activity, color: "bg-green-500" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-white rounded-xl shadow-sm animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat) => (
                        <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Recent Activity Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">System Overview</h2>
                <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <p>Chart / Activity Log Placeholder</p>
                </div>
            </div>
        </div>
    );
}
