"use client";

import AgentSidebar from "@/components/layout/AgentSidebar";
import RoleGuard from "@/components/RoleGuard";

export default function AgentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RoleGuard allowed={["agent", "admin"]}>
            <div className="min-h-screen bg-gray-50/30 flex">
                <AgentSidebar />

                {/* Main Content Area */}
                <main className="flex-1 ml-64 min-h-screen bg-white md:bg-gray-50/30 transition-all duration-300">
                    <div className="max-w-7xl mx-auto min-h-screen">
                        {children}
                    </div>
                </main>
            </div>
        </RoleGuard>
    );
}
