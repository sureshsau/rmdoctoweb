"use client";

import { useState } from "react";
import { UserPlus, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { agentService, RegisterAgentRequest } from "@/services/agent.service";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useRouter } from "next/navigation";

export default function RegisterAgentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState<RegisterAgentRequest>({
        name: "",
        phone: "",
        email: "",
        password: "",
        panCard: "",
        aadhaarCard: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            await agentService.registerAgent(formData);
            setSuccess("Agent registered successfully!");
            setFormData({ name: "", phone: "", email: "", password: "", panCard: "", aadhaarCard: "" });
            // Optional: router.push("/admin/agents") if we had a list page
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Register New Agent</h1>
                    <p className="text-gray-500 text-sm">Onboard field agents / marketing partners</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-600 p-4 rounded-lg border border-green-100 text-sm">
                    {success}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Full Name</label>
                            <input required name="name" value={formData.name} onChange={handleChange} className="w-full border rounded-lg p-2" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Phone</label>
                            <input required name="phone" value={formData.phone} onChange={handleChange} className="w-full border rounded-lg p-2" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <input name="email" value={formData.email} onChange={handleChange} className="w-full border rounded-lg p-2" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Password</label>
                            <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full border rounded-lg p-2" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">PAN Card</label>
                            <input name="panCard" value={formData.panCard} onChange={handleChange} className="w-full border rounded-lg p-2" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Aadhaar Card</label>
                            <input name="aadhaarCard" value={formData.aadhaarCard} onChange={handleChange} className="w-full border rounded-lg p-2" />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700 transition shadow-sm disabled:opacity-50"
                        >
                            <UserPlus className="w-4 h-4" />
                            {loading ? "Registering..." : "Register Agent"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
