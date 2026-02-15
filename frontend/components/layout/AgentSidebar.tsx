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
    X
} from "lucide-react";
import { useAuthContext } from "@/state/AuthContext";

type AgentSidebarProps = {
    isOpen?: boolean;
    onClose?: () => void;
};

export default function AgentSidebar({ isOpen = true, onClose }: AgentSidebarProps) {
    const pathname = usePathname();
    const { logout, user } = useAuthContext();

    const links = [
        { name: "Home", href: "/agent/dashboard", icon: LayoutDashboard },
        { name: "Order Medicine", href: "/medicine-store", icon: ShoppingBag },
        { name: "My Orders", href: "/agent/orders", icon: History },
        // Attendance link removed
    ];

    return (
        <aside
            className={`app-sidebar flex flex-col fixed left-0 top-0 bottom-0 z-40 transition-transform duration-300 ease-out
                ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
            style={{ width: "var(--sidebar-width)" }}
        >
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center shadow-md shrink-0">
                        <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-slate-800 truncate">Agent</span>
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

            <div className="px-4 py-4 shrink-0">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {user?.name?.charAt(0) || "A"}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-[10px] font-bold text-teal-600 uppercase">Agent</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
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
                                    ? "bg-teal-600 text-white"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                            <span className="truncate">{link.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-3 border-t border-slate-100 shrink-0 space-y-0.5">
                <Link
                    href="/agent/profile"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                >
                    <UserCircle className="w-5 h-5 shrink-0" />
                    Profile
                </Link>
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
