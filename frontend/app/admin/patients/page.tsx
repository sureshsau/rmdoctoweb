"use client";

import { useEffect, useState } from "react";
import { User, Search, Plus } from "lucide-react";
import { userService } from "@/services/user.service";
import { AuthUser } from "@/services/auth.service";

export default function AdminPatientsPage() {
    const [patients, setPatients] = useState<AuthUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        async function fetchPatients() {
            try {
                const res = await userService.getAllUsers();
                if (res.success && Array.isArray(res.data)) {
                    // STRICT FILTERING: Backend sends all users. We filter for patients.
                    // Adjust logic if your backend uses specific roles for patients
                    const filtered = res.data.filter(
                        (u) => u.dashboard === "patient" || u.dashboard === "user"
                    );
                    setPatients(filtered);
                }
            } catch (err) {
                console.error("Failed to fetch patients", err);
            } finally {
                setLoading(false);
            }
        }
        fetchPatients();
    }, []);

    const displayedPatients = patients.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone?.includes(searchTerm) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
                    <p className="text-gray-500 text-sm">Manage registered patients</p>
                </div>
                {/* Note: POST /user exists, implies we could add a user here. 
            For now, just the button placeholder or navigation to Add User page. */}
                <button className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition shadow-sm">
                    <Plus className="w-4 h-4" />
                    Add Patient
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search by name, phone, or email..."
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
                                <th className="px-6 py-4 font-semibold text-gray-700">Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Contact</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Type</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        Loading patients...
                                    </td>
                                </tr>
                            ) : displayedPatients.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No patients found.
                                    </td>
                                </tr>
                            ) : (
                                displayedPatients.map((patient) => (
                                    <tr key={patient.id || patient.identifier} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold">
                                                    {patient.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-gray-900">{patient.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-gray-800">{patient.phone}</span>
                                                <span className="text-gray-400 text-xs">{patient.email || "N/A"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                {patient.dashboard || "User"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {/* Backend sends specific status fields? user.model says isActive, isBlocked */}
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium 
                        ${(patient as any).isBlocked ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}
                      `}>
                                                {(patient as any).isBlocked ? "Blocked" : "Active"}
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
