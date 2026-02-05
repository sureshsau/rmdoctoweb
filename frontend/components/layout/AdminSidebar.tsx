"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Stethoscope,
    Pill,
    CalendarCheck,
    UserPlus,
    LogOut,
    Settings,
    Shield,
    Clock
} from "lucide-react";
import { useAuthContext } from "@/state/AuthContext";

export default function AdminSidebar() {
    const pathname = usePathname();
    const { logout } = useAuthContext();

    const links = [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Doctors", href: "/admin/doctors", icon: Stethoscope },
        { name: "Medicine", href: "/admin/medicine", icon: Pill },
        { name: "Roles", href: "/admin/roles", icon: Shield },
        { name: "Attendance", href: "/admin/attendance/settings", icon: Clock },
        { name: "Agents", href: "/admin/agents", icon: UserPlus },
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-40 shadow-sm">
            <div className="h-16 flex items-center px-6 border-b border-gray-100">
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    Admin Panel
                </span>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                                    ? "bg-cyan-50 text-cyan-700 shadow-sm"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }
              `}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? "text-cyan-600" : "text-gray-400"}`} />
                            {link.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100 space-y-1">
                <button
                    onClick={() => logout({ redirectTo: "/" })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
