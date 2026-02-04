"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingBag,
    History,
    Clock,
    UserCircle,
    LogOut,
    Settings,
    HelpCircle
} from "lucide-react";
import { useAuthContext } from "@/state/AuthContext";

export default function AgentSidebar() {
    const pathname = usePathname();
    const { logout, user } = useAuthContext();

    const links = [
        { name: "Dashboard", href: "/agent/dashboard", icon: LayoutDashboard },
        { name: "Order Medicine", href: "/medicine-store", icon: ShoppingBag },
        { name: "My Orders", href: "/agent/orders", icon: History },
        { name: "Attendance", href: "/agent/attendance", icon: Clock },
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-100 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-40 shadow-sm">
            {/* Header */}
            <div className="h-20 flex items-center px-6 border-b border-gray-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
                        <ShoppingBag className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                        Agent Hub
                    </span>
                </div>
            </div>

            {/* User Profile Summary */}
            <div className="p-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        {user?.name?.charAt(0) || "A"}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase">Verified Agent</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                                ${isActive
                                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-50"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                }
                            `}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                            {link.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-gray-50 space-y-1">
                <Link
                    href="/agent/profile"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                >
                    <UserCircle className="w-5 h-5" />
                    Profile
                </Link>
                <button
                    onClick={() => logout({ redirectTo: "/" })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
