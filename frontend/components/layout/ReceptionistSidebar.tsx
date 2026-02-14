"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Stethoscope,
    ClipboardList,
    ShoppingBag,
    LogOut,
    ShieldCheck,
    Clock,
    X
} from "lucide-react";
import { useAuthContext } from "@/state/AuthContext";

type ReceptionistSidebarProps = {
    isOpen?: boolean;
    onClose?: () => void;
};

export default function ReceptionistSidebar({ isOpen = false, onClose }: ReceptionistSidebarProps) {
    const pathname = usePathname();
    const { logout, user } = useAuthContext();

    const links = [
        { name: "Overview", href: "/receptionist/dashboard", icon: LayoutDashboard },
        { name: "Users", href: "/receptionist/dashboard#users", icon: Users },
        { name: "Doctors", href: "/receptionist/dashboard#doctors", icon: Stethoscope },
        { name: "Orders", href: "/receptionist/dashboard#orders", icon: ClipboardList },
        { name: "Medicine Store", href: "/medicine-store", icon: ShoppingBag },
        { name: "Attendance", href: "/receptionist/attendance", icon: Clock },
    ];

    return (
        <aside
            className={`app-sidebar flex flex-col fixed left-0 top-0 bottom-0 z-40 transition-transform duration-300 ease-out
                ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
            style={{ width: "var(--sidebar-width)" }}
        >
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-md shrink-0">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-slate-800 truncate">Reception</span>
                </div>
                <button
                    type="button"
                    aria-label="Close sidebar"
                    className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                    onClick={onClose}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="px-4 py-4 shrink-0">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
                    <p className="text-sm font-bold text-slate-900 truncate mt-0.5">{user?.name || "Receptionist"}</p>
                </div>
            </div>

            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive =
                        pathname === link.href ||
                        (link.href === "/receptionist/dashboard" && pathname.startsWith("/receptionist")) ||
                        (link.href === "/medicine-store" && pathname.startsWith("/medicine-store"));

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                ${isActive
                                    ? "bg-amber-500 text-white"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
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
