"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Package,
  LogOut,
  Settings,
  ShieldCheck,
  Clock,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuthContext } from "@/state/AuthContext";

type MarketingAgentSidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function MarketingAgentSidebar({ isOpen = false, onClose }: MarketingAgentSidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuthContext();

  const links = [
    { name: "Overview", href: "/marketing-agent/dashboard", icon: LayoutDashboard },
    { name: "Orders", href: "/marketing-agent/orders", icon: Package },
    { name: "My Team", href: "/marketing-agent/team", icon: Users },
    { name: "Recruitment", href: "/marketing-agent/recruit", icon: UserPlus },
    { name: "Attendance", href: "/marketing-agent/attendance", icon: Clock },
    { name: "Wallet", href: "/marketing-agent/wallet", icon: ShieldCheck },
  ];

  return (
    <aside
      className={`app-sidebar flex flex-col fixed left-0 top-0 bottom-0 z-40 transition-transform duration-300 ease-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      style={{ width: "var(--sidebar-width)" }}
    >
      {/* Brand */}
      <div className="h-16 flex items-center justify-between px-4 lg:px-5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <span className="text-base font-bold text-slate-800 truncate block">Marketing</span>
            <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider truncate block">Agent Hub</span>
          </div>
        </div>
        <button
          type="button"
          aria-label="Close menu"
          className="lg:hidden p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User card */}
      <div className="px-3 pt-4 pb-2 shrink-0">
        <div className="p-3.5 bg-linear-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Signed in as</p>
          <p className="text-sm font-bold text-slate-900 truncate mt-1">{user?.name || "Marketing Agent"}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 min-h-11
                ${isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
                }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span className="truncate flex-1">{link.name}</span>
              {isActive && <ChevronRight className="w-4 h-4 shrink-0 opacity-80" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 shrink-0 space-y-0.5">
        <Link
          href="/marketing-agent/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors min-h-11"
        >
          <Settings className="w-5 h-5 shrink-0 text-slate-400" />
          Settings
        </Link>
        <button
          onClick={() => logout({ redirectTo: "/" })}
          className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors min-h-11"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
