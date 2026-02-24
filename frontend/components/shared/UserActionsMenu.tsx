import React, { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@/services/auth.service";

interface UserActionsMenuProps {
  user: AuthUser;
  onRoleClick: (user: AuthUser) => void;
  setTransferModal?: (user: AuthUser) => void;
}

export default function UserActionsMenu({ user, onRoleClick, setTransferModal }: UserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleScroll() {
      if (open) setOpen(false);
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      
      // Calculate position on open
      if (buttonRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;
        const dropdownHeight = 200; // Approximate dropdown height
        
        setDropdownPosition(spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? 'top' : 'bottom');
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

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
      { id: "give-role", label: "Give Role" },
    ],
  };

  const userRole = user.roles?.[0] || "default";
  const actions = ACTIONS_MAP[userRole] || ACTIONS_MAP.default;

  function handleAction(action: { id: string; label: string; route?: string }) {
    setOpen(false);
    
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
    }
  }

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 active:bg-gray-200"
        aria-label="More actions"
      >
        <MoreVertical className="w-5 h-5 text-gray-600" />
      </button>

      {open && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />
          
          {/* Dropdown menu - responsive */}
          <div 
            className={`
              fixed md:absolute z-50
              md:w-48 md:min-w-[180px]
              left-4 right-4 md:left-auto
              ${dropdownPosition === 'bottom' 
                ? 'bottom-4 md:bottom-auto md:top-full md:mt-2' 
                : 'top-4 md:top-auto md:bottom-full md:mb-2'
              }
              md:right-0
              bg-white rounded-xl shadow-xl border border-gray-200 py-2
              max-h-[80vh] overflow-y-auto
              animate-fade-in-up
            `}
          >
            {actions.map((action) => (
              <button
                key={action.id}
                className="w-full text-left px-4 py-3.5 md:py-2.5 hover:bg-cyan-50 text-gray-700 text-base md:text-sm border-b border-gray-50 last:border-0 active:bg-cyan-100"
                onClick={() => handleAction(action)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}