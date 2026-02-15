import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, UserCog, Clock } from "lucide-react";
import Link from "next/link";
import type { AuthUser } from "@/services/auth.service";

interface UserActionsMenuProps {
  user: AuthUser;
  onRoleClick: (user: AuthUser) => void;
}

export default function UserActionsMenu({ user, onRoleClick }: UserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        <div className="absolute right-0 z-20 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-2 flex flex-col text-sm animate-fade-in-up"
          style={{ minWidth: 140 }}
        >
          <Link
            href={`/admin/users/${user._id || user.id}/attendance?name=${encodeURIComponent(user.name || "")}&role=${encodeURIComponent((user.roles && user.roles[0]) || "")}&phone=${encodeURIComponent(user.phone || "")}`}
            className="flex items-center gap-2 px-4 py-2 hover:bg-cyan-50 text-gray-700"
            onClick={() => setOpen(false)}
          >
            <Clock className="w-4 h-4 text-cyan-600" />
            Attendance
          </Link>
          <button
            className="flex items-center gap-2 px-4 py-2 hover:bg-cyan-50 text-gray-700 w-full text-left"
            onClick={() => { setOpen(false); onRoleClick(user); }}
          >
            <UserCog className="w-4 h-4 text-cyan-600" />
            Roles
          </button>
        </div>
      )}
    </div>
  );
}
