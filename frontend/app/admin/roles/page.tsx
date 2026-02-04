"use client";

import { useEffect, useState } from "react";
import { Shield, Plus, Lock } from "lucide-react";
import Link from "next/link";
import { roleService, Role } from "@/services/role.service";

export default function AdminRolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRoles() {
            try {
                const res = await roleService.getAllRoles();
                if (res.success && Array.isArray(res.data)) {
                    setRoles(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch roles", err);
            } finally {
                setLoading(false);
            }
        }
        fetchRoles();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Role Management</h1>
                    <p className="text-gray-500 text-sm">Define user roles and permissions</p>
                </div>
                <Link
                    href="/admin/roles/create"
                    className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Create Role
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-white rounded-xl shadow-sm animate-pulse border border-gray-100" />
                    ))
                ) : roles.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-500">No roles found. Create one properly.</div>
                ) : (
                    roles.map((role) => (
                        <div key={role._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{role.name}</h3>
                                        <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{role.key}</code>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Permissions</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {role.permissions.slice(0, 5).map((perm, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-gray-50 text-gray-600 border border-gray-100 rounded text-[10px] font-mono">
                                                {perm}
                                            </span>
                                        ))}
                                        {role.permissions.length > 5 && (
                                            <span className="px-2 py-1 bg-gray-50 text-gray-400 border border-gray-100 rounded text-[10px]">
                                                +{role.permissions.length - 5} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex justify-end">
                                <button disabled className="text-xs font-medium text-gray-400 cursor-not-allowed">
                                    Edit (Coming Soon)
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
