"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import MarketingAgentSidebar from "@/components/layout/MarketingAgentSidebar";
import RoleGuard from "@/components/RoleGuard";

export default function MarketingAgentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <RoleGuard allowed={["marketing_agent", "admin"]}>
            <div className="min-h-screen bg-gray-50/50 flex">
                <MarketingAgentSidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                {sidebarOpen && (
                    <button
                        type="button"
                        aria-label="Close sidebar"
                        className="fixed inset-0 bg-black/30 z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <div className="flex-1 min-h-screen lg:ml-64">
                    <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100 lg:hidden">
                        <div className="h-14 px-4 flex items-center justify-between">
                            <button
                                type="button"
                                aria-label="Open sidebar"
                                className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-100 bg-white shadow-sm"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="w-5 h-5 text-gray-700" />
                            </button>
                            <span className="text-sm font-black text-gray-800">Marketing</span>
                            <div className="w-10" />
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <main className="min-h-screen">
                        {children}
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
}
