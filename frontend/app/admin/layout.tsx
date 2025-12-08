'use client';

import React, { useState, useCallback, useEffect } from 'react'; // ✅ added useEffect
import { useRouter } from "next/navigation";                   // ✅ added
import { Sidebar } from '@/components/admin/Sidebar';
import { TopBar } from '@/components/admin/TopBar';
import { cn } from '@/lib/utils';
import { getUserFromToken } from "@/lib/auth";                  // ✅ added

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();                                   // ✅ added
  const [authChecked, setAuthChecked] = useState(false);        // ✅ added

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(prev => !prev);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  // ✅ ✅ ADMIN AUTH GUARD (CORE SECURITY)
  useEffect(() => {
    const user = getUserFromToken();

    // ❌ Not logged in
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // ❌ Logged in but NOT admin
    if (user.role !== "admin") {
      router.push("/unauthorized");
      return;
    }

    // ✅ Authorized
    setAuthChecked(true);
  }, [router]);

  // ✅ Prevent UI flash before auth check finishes
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-semibold">
        Verifying admin access...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 fixed inset-0">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggleCollapse={toggleSidebar}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeMobileSidebar}
          />
          
          {/* Sidebar */}
          <div className="relative transform transition-transform duration-300 ease-in-out">
            <Sidebar
              isCollapsed={false}
              onToggleCollapse={toggleSidebar}
              isMobile={true}
              onCloseMobile={closeMobileSidebar}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar 
          onToggleSidebar={toggleSidebar}
          onToggleMobileSidebar={toggleMobileSidebar}
        />
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
