"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Shield, X } from "lucide-react";
import Link from "next/link";
import { roleService, CreateRoleRequest } from "@/services/role.service";
import { permissionService, Permission } from "@/services/permission.service";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export default function CreateRolePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState<CreateRoleRequest>({
        key: "",
        name: "",
        permissions: [],
    });

    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [permissionSearch, setPermissionSearch] = useState("");

    const normalizeKey = (value: string) => value.toLowerCase().replace(/\s+/g, "_");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === "key" ? normalizeKey(value) : value
        });
    };

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                const res = await permissionService.getAll();
                if (res.success) setPermissions(res.data || []);
            } catch (err) {
                console.error("Failed to load permissions", err);
            }
        };
        fetchPermissions();
    }, []);

    const togglePermission = (permKey: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permKey)
                ? prev.permissions.filter(p => p !== permKey)
                : [...prev.permissions, permKey]
        }));
    };

    const selectAllPermissions = () => {
        setFormData(prev => ({
            ...prev,
            permissions: permissions.map(p => p.key)
        }));
    };

    const clearPermissions = () => {
        setFormData(prev => ({
            ...prev,
            permissions: []
        }));
    };

    const filteredPermissions = permissions.filter((perm) => {
        if (!permissionSearch.trim()) return true;
        const q = permissionSearch.toLowerCase();
        return perm.label.toLowerCase().includes(q) || perm.key.toLowerCase().includes(q) || perm.category.toLowerCase().includes(q);
    });

    const permissionsByCategory = filteredPermissions.reduce<Record<string, Permission[]>>((acc, perm) => {
        if (!acc[perm.category]) acc[perm.category] = [];
        acc[perm.category].push(perm);
        return acc;
    }, {});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.key.trim()) {
            setError("Role key is required.");
            return;
        }
        if (!/^[a-z0-9_]+$/.test(formData.key)) {
            setError("Role key must be lowercase with underscores only.");
            return;
        }
        if (!formData.name.trim()) {
            setError("Role name is required.");
            return;
        }
        if (formData.permissions.length === 0) {
            setError("Please add at least one permission.");
            return;
        }

        setLoading(true);

        try {
            await roleService.createRole({
                ...formData,
                key: normalizeKey(formData.key)
            });
            router.push("/admin/roles");
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/roles" className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Create New Role</h1>
                    <p className="text-gray-500 text-sm">Define a role and attach precise permissions.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-[28px] shadow-sm border border-gray-100 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Key */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Role Key</label>
                        <input
                            name="key"
                            value={formData.key}
                            onChange={handleChange}
                            placeholder="e.g. nurse_head"
                            className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 mt-1"
                            required
                        />
                        <p className="text-xs text-gray-400 mt-1">Unique identifier (lowercase, no spaces)</p>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Role Name</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Head Nurse"
                            className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 mt-1"
                            required
                        />
                    </div>

                    {/* Permissions */}
                    <div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Permissions</label>
                            <div className="flex items-center gap-2 text-xs font-bold text-cyan-700">
                                <button type="button" onClick={selectAllPermissions} className="hover:underline">Select all</button>
                                <span className="text-gray-300">•</span>
                                <button type="button" onClick={clearPermissions} className="hover:underline">Clear</button>
                            </div>
                        </div>
                        <input
                            value={permissionSearch}
                            onChange={(e) => setPermissionSearch(e.target.value)}
                            placeholder="Search permissions"
                            className="w-full mt-2 mb-4 px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-cyan-500"
                        />
                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                            {Object.entries(permissionsByCategory).map(([category, perms]) => (
                                <div key={category} className="border border-gray-100 rounded-2xl p-3 bg-white">
                                    <div className="text-[11px] font-black uppercase tracking-wider text-gray-500 mb-2 flex items-center justify-between">
                                        <span>{category}</span>
                                        <span className="text-[10px] text-gray-400 font-bold">{perms.length} perms</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {perms.map(perm => {
                                            const active = formData.permissions.includes(perm.key);
                                            return (
                                                <button
                                                    key={perm.key}
                                                    type="button"
                                                    onClick={() => togglePermission(perm.key)}
                                                    className={`px-3 py-1.5 text-[11px] rounded-xl border transition-all ${active
                                                        ? "bg-cyan-50 border-cyan-500 text-cyan-700"
                                                        : "bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300"}`}
                                                >
                                                    {perm.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            {permissions.length === 0 && (
                                <div className="text-sm text-gray-400">No permissions loaded.</div>
                            )}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">{formData.permissions.length} permission(s) selected</div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-cyan-600 text-white px-6 py-3 rounded-2xl hover:bg-cyan-700 transition shadow-sm disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? "Creating..." : "Save Role"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
