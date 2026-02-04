"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Shield, X } from "lucide-react";
import Link from "next/link";
import { roleService, CreateRoleRequest } from "@/services/role.service";
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

    const [permInput, setPermInput] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const addPermission = () => {
        if (!permInput.trim()) return;
        if (formData.permissions.includes(permInput.trim())) return;

        setFormData(prev => ({
            ...prev,
            permissions: [...prev.permissions, permInput.trim()]
        }));
        setPermInput("");
    };

    const removePermission = (perm: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.filter(p => p !== perm)
        }));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addPermission();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.permissions.length === 0) {
            setError("Please add at least one permission.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await roleService.createRole(formData);
            router.push("/admin/roles");
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/roles" className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Create New Role</h1>
                    <p className="text-gray-500 text-sm">Define a new system role</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Key */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Role Key</label>
                        <input
                            name="key"
                            value={formData.key}
                            onChange={handleChange}
                            placeholder="e.g. nurse_head"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 mt-1"
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
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 mt-1"
                            required
                        />
                    </div>

                    {/* Permissions */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Permissions</label>
                        <div className="flex gap-2 mt-1">
                            <input
                                value={permInput}
                                onChange={(e) => setPermInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="e.g. medicine.read"
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            />
                            <button
                                type="button"
                                onClick={addPermission}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                            >
                                Add
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                            {formData.permissions.map(perm => (
                                <span key={perm} className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-sm">
                                    {perm}
                                    <button type="button" onClick={() => removePermission(perm)}>
                                        <X className="w-3 h-3 hover:text-indigo-900" />
                                    </button>
                                </span>
                            ))}
                            {formData.permissions.length === 0 && (
                                <span className="text-sm text-gray-400 italic">No permissions added yet</span>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700 transition shadow-sm disabled:opacity-50"
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
