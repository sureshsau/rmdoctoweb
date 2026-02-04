"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { userService, CreateUserRequest } from "@/services/user.service";
import { roleService, Role } from "@/services/role.service";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export default function AddUserPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState<CreateUserRequest>({
        name: "",
        phone: "",
        email: "",
        password: "",
        dashboard: "user",
        roles: [],
    });

    const dashboardOptions = [
        { value: "admin", label: "Admin" },
        { value: "doctor", label: "Doctor" },
        { value: "receptionist", label: "Receptionist" },
        { value: "patient", label: "Patient" },
        { value: "agent", label: "Agent" },
        { value: "marketing_agent", label: "Marketing Agent" },
        { value: "user", label: "General User" },
    ];

    useEffect(() => {
        // Fetch available roles for the dropdown
        async function fetchRoles() {
            try {
                const res = await roleService.getAllRoles();
                if (res.success && Array.isArray(res.data)) {
                    setRoles(res.data);
                }
            } catch (err) {
                console.error("Failed to load roles", err);
            }
        }
        fetchRoles();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        // Determine if we want single select or multi. Backend supports array.
        // For simplicity, this UI adds one role at a time or we can just treat the select as the "primary role"
        // Let's assume we toggle the selected role in the array
        const value = e.target.value;
        if (!value) return;

        // Simple logic: replace roles array with just this one for now (common use case)
        // Or allow multiple if you build a multi-select UI.
        setFormData((prev) => ({ ...prev, roles: [value] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await userService.createUser(formData);
            router.push("/admin/dashboard"); // Redirect back to dashboard or list
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/dashboard"
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Add New User</h1>
                    <p className="text-gray-500 text-sm">Create a new account for Doctor, Patient, or Staff</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Full Name</label>
                            <input
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                                placeholder="John Doe"
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Phone Number</label>
                            <input
                                name="phone"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                                placeholder="9876543210"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email (Optional)</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                                placeholder="john@example.com"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Password</label>
                            <input
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                                placeholder="******"
                            />
                        </div>

                        {/* Dashboard Type */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Dashboard Type</label>
                            <select
                                name="dashboard"
                                value={formData.dashboard}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none bg-white"
                            >
                                {dashboardOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400">Determines which interface they see.</p>
                        </div>

                        {/* Role Assignment */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Assign Role</label>
                            <select
                                onChange={handleRoleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none bg-white"
                                defaultValue=""
                            >
                                <option value="" disabled>Select a role...</option>
                                {roles.map(role => (
                                    <option key={role._id} value={role.key}>{role.name} ({role.key})</option>
                                ))}
                            </select>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.roles?.map(r => (
                                    <span key={r} className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded text-xs border border-cyan-100">
                                        {r}
                                    </span>
                                ))}
                            </div>
                        </div>

                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700 transition shadow-sm disabled:opacity-50"
                        >
                            <UserPlus className="w-4 h-4" />
                            {loading ? "Creating..." : "Create User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
