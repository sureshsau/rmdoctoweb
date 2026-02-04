"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    MapPin,
    Target,
    UserPlus,
    LogOut,
    Settings,
    TrendingUp,
    ShieldCheck
} from "lucide-react";
import { useAuthContext } from "@/state/AuthContext";

export default function MarketingAgentSidebar() {
    const pathname = usePathname();
    const { logout, user } = useAuthContext();

    const links = [
        { name: "Overview", href: "/marketing-agent/dashboard", icon: LayoutDashboard },
        { name: "My Team", href: "/marketing-agent/team", icon: Users },
        { name: "Visit Tracking", href: "/marketing-agent/visits", icon: MapPin },
        { name: "Targets", href: "/marketing-agent/targets", icon: TrendingUp },
        { name: "Recruitment", href: "/marketing-agent/recruit", icon: UserPlus },
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-100 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-40 shadow-sm transition-all duration-300">
            {/* Logo Section */}
            <div className="h-20 flex items-center px-6 border-b border-gray-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <ShieldCheck className="text-white w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                        Marketing
                    </span>
                </div>
            </div>

            {/* Profile Summary */}
            <div className="px-6 py-6">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Signed in as</p>
                    <p className="text-sm font-bold text-gray-900 truncate mt-1">{user?.name || "Marketing Agent"}</p>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                                ${isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
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

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-50 space-y-1">
                <Link
                    href="/marketing-agent/settings"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors"
                >
                    <Settings className="w-5 h-5" />
                    Settings
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
