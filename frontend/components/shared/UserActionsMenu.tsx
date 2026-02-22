import React, { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@/services/auth.service";

interface UserActionsMenuProps {
  user: AuthUser;
  onRoleClick: (user: AuthUser) => void;
  setTransferModal?: (user: AuthUser) => void;
}


export default function UserActionsMenu({ user, onRoleClick, setTransferModal }: UserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // ACTIONS_MAP as per mobile expo, with 'Edit Profile' removed from all roles
  const ACTIONS_MAP: Record<string, Array<{ id: string; label: string; route?: string }>> = {
    admin: [
      { id: "give-role", label: "Give Role" },
      { id: "set-attendance", label: "Set Attendance", route: "/admin/users/:id/attendance" },
      { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    ],
    marketing_agent: [
      { id: "set-attendance", label: "Set Attendance", route: "/admin/users/:id/attendance" },
      { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    ],
    rmrider: [
      { id: "set-attendance", label: "Set Attendance", route: "/admin/users/:id/attendance" },
      { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    ],
    subadmin: [
      { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    ],
    receptionist: [
      { id: "transfer-rmcoin", label: "Transfer RM Coins" },
      { id: "set-attendance", label: "Set Attendance", route: "/admin/users/:id/attendance" },
    ],
    doctor: [
      { id: "transfer-rmcoin", label: "Transfer RM Coins" },
      { id: "set-attendance", label: "Set Attendance", route: "/admin/users/:id/attendance" },
    ],
    agent: [
      { id: "orders", label: "View Orders", route: "/agent/orders" },
      { id: "rmcredit", label: "RM Credit", route: "/admin/users/:id/rmcredit" },
      { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    ],
    default: [
      { id: "give-role", label: "Give Role" },      // No actions for default role (or add others as needed)
    ],
  };

  const userRole = user.roles?.[0] || "default";
  const actions = ACTIONS_MAP[userRole] || ACTIONS_MAP.default;

  function handleAction(action: { id: string; label: string; route?: string }) {
    setOpen(false);
    // Transfer RM Coins modal (to be implemented)
    if (action.id === "transfer-rmcoin") {
      if (setTransferModal) setTransferModal(user);
      return;
    }
    if (action.id === "give-role") {
      onRoleClick(user);
      return;
    }
    if (action.route) {
      let route = action.route.includes(":id")
        ? action.route.replace(":id", user._id || user.id || "")
        : action.route;
      // For RM Credit/RM Coin, pass params
      if (
        action.id === "rmcredit" ||
        action.id === "rmcoin" ||
        route.includes("/rmcredit") ||
        route.includes("/rmcoin")
      ) {
        router.push(
          `${route}?id=${user._id || user.id || ""}&name=${encodeURIComponent(user.name || "")}&phone=${encodeURIComponent(user.phone || "")}&email=${encodeURIComponent(user.email || "")}&role=${encodeURIComponent(user.roles?.[0] || "")}`
        );
        return;
      }
      router.push(route);
      return;
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        aria-label="More actions"
        onClick={() => setOpen((v) => !v)}
        tabIndex={0}
      >
        <MoreVertical className="w-5 h-5 text-gray-500" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 flex flex-col text-sm animate-fade-in-up"
          style={{ minWidth: 180 }}
        >
          {actions.map((action) => (
            <button
              key={action.id}
              className="flex items-center gap-2 px-4 py-2 hover:bg-cyan-50 text-gray-700 w-full text-left"
              onClick={() => handleAction(action)}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
