"use client";

import MarketingAgentSidebar from "@/components/layout/MarketingAgentSidebar";
import RoleGuard from "@/components/RoleGuard";

export default function MarketingAgentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RoleGuard allowed={["marketing_agent", "admin"]}>
            <div className="min-h-screen bg-gray-50/50 flex">
                <MarketingAgentSidebar />

                {/* Main Content Area */}
                <main className="flex-1 ml-64 min-h-screen">
                    {children}
                </main>
            </div>
        </RoleGuard>
    );
}
