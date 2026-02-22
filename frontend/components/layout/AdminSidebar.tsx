"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Pill,
    LogOut,
    Shield,
    Clock,
    X,
    Wallet
} from "lucide-react";
import { useAuthContext } from "@/state/AuthContext";

type AdminSidebarProps = {
    isOpen?: boolean;
    onClose?: () => void;
};

export default function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuthContext();

    const links = [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Medicine", href: "/admin/medicine", icon: Pill },
        { name: "Roles", href: "/admin/roles", icon: Shield },
        { name: "Attendance", href: "/admin/attendance/settings", icon: Clock },
        { name: "Wallet", href: "/admin/wallet", icon: Wallet },
    ];

    return (
        <aside
            className={`app-sidebar flex flex-col fixed left-0 top-0 bottom-0 z-40 transition-transform duration-300 ease-out
                ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
            style={{ width: "var(--sidebar-width)" }}
        >
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-md shrink-0">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-slate-800 truncate">Admin</span>
                </div>
                {onClose && (
                    <button
                        type="button"
                        aria-label="Close menu"
                        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                        onClick={onClose}
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                ${isActive
                                    ? "bg-teal-50 text-teal-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-teal-600" : "text-slate-400"}`} />
                            <span className="truncate">{link.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-3 border-t border-slate-100 shrink-0">
                <button
                    onClick={() => logout({ redirectTo: "/" })}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
