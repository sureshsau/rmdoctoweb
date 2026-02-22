"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import RoleGuard from "@/components/RoleGuard";
import ReceptionistSidebar from "@/components/layout/ReceptionistSidebar";

export default function ReceptionistLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <RoleGuard allowed={["receptionist", "admin"]}>
            <div className="min-h-screen app-shell flex">
                <ReceptionistSidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                {sidebarOpen && (
                    <button
                        type="button"
                        aria-label="Close sidebar"
                        className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-[2px]"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <div className="flex-1 min-h-screen min-w-0 lg:ml-64">
                    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100 lg:hidden shrink-0">
                        <div className="h-14 px-4 flex items-center justify-between">
                            <button
                                type="button"
                                aria-label="Open menu"
                                className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="w-5 h-5 text-slate-700" />
                            </button>
                            <span className="text-sm font-bold text-slate-800">Reception</span>
                            <div className="w-10" />
                        </div>
                    </header>

                    <main className="app-main">
                        {children}
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
}
