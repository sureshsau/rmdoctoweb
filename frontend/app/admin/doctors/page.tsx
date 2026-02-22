"use client";

import { useEffect, useState } from "react";
import { Stethoscope, Search, Plus, Shield } from "lucide-react";
import { userService } from "@/services/user.service";
import { AuthUser } from "@/services/auth.service";

export default function AdminDoctorsPage() {
    const [doctors, setDoctors] = useState<AuthUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        async function fetchDoctors() {
            try {
                const res = await userService.getAllUsers();
                if (res.success && Array.isArray(res.data)) {
                    // STRICT FILTERING for Doctors
                    const filtered = res.data.filter(
                        (u) =>
                            u.dashboard === "doctor" ||
                            (u.roles && u.roles.includes("doctor"))
                    );
                    setDoctors(filtered);
                }
            } catch (err) {
                console.error("Failed to fetch doctors", err);
            } finally {
                setLoading(false);
            }
        }
        fetchDoctors();
    }, []);

    const displayedDoctors = doctors.filter((doc) =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.phone?.includes(searchTerm) ||
        doc.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Doctors</h1>
                    <p className="text-gray-500 text-sm">Manage registered medical professionals</p>
                </div>
                <button className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition shadow-sm">
                    <Plus className="w-4 h-4" />
                    Add Doctor
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search doctor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">Doctor Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Contact</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Permissions</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        Loading doctors...
                                    </td>
                                </tr>
                            ) : displayedDoctors.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No doctors found.
                                    </td>
                                </tr>
                            ) : (
                                displayedDoctors.map((doc) => (
                                    <tr key={doc.id || doc.identifier} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                                                    {doc.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-gray-900">{doc.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-gray-800">{doc.phone}</span>
                                                <span className="text-gray-400 text-xs">{doc.email || "N/A"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {/* Show Roles/Permissions summary */}
                                                {(doc.roles || []).map(r => (
                                                    <span key={r} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 uppercase">
                                                        {r}
                                                    </span>
                                                ))}
                                                {/* Fallback if no roles displayed */}
                                                {(!doc.roles || doc.roles.length === 0) && (
                                                    <span className="text-gray-400 text-xs italic">No specific roles</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium 
                        ${(doc as any).isBlocked ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}
                      `}>
                                                {(doc as any).isBlocked ? "Blocked" : "Active"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
