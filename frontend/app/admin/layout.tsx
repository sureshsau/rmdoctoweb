"use client";

import AdminSidebar from "@/components/layout/AdminSidebar";
import RoleGuard from "@/components/RoleGuard";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RoleGuard allowed={["admin", "subadmin"]}>
            <div className="min-h-screen bg-gray-50 flex">
                {/* Sidebar */}
                <AdminSidebar />

                {/* Main Content Area */}
                <main className="flex-1 min-w-0 ml-64 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </RoleGuard>
    );
}
