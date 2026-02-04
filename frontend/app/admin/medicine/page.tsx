"use client";

import { useEffect, useState } from "react";
import { Pill, Plus, Trash2, Search, X } from "lucide-react";
import { medicineService, Medicine } from "@/services/medicine.service";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import Image from "next/image";

export default function AdminMedicinePage() {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submissionLoading, setSubmissionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        manufacturer: "",
        price: "",
        stock: "",
        dosageForm: "",
    });
    const [files, setFiles] = useState<FileList | null>(null);

    useEffect(() => {
        loadMedicines();
    }, []);

    async function loadMedicines() {
        setLoading(true);
        try {
            const res = await medicineService.getAllMedicines();
            // Backend controller returns { success: true, data: [...], ... }
            // Or sometimes directly data in result. Verification needed. 
            // Based on analysis: res.data might be the array if paginated result is spread.
            // Let's assume standard response structure for now.
            if (res.data && Array.isArray(res.data)) {
                setMedicines(res.data);
            } else if ((res as any).medicines) {
                setMedicines((res as any).medicines);
            }
        } catch (err) {
            console.error("Failed to load medicines", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this medicine?")) return;
        try {
            await medicineService.deleteMedicine(id);
            setMedicines(prev => prev.filter(m => m._id !== id));
        } catch (err) {
            alert(getApiErrorMessage(err));
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmissionLoading(true);
        try {
            const data = new FormData();
            // Handle nested keys for Mongoose (Multipart/Form-data)
            // If backend parses nested keys (extended: true), this works.
            if (key === 'stock') {
                data.append('stock[totalQuantity]', value);
                data.append('stock[minAlertQuantity]', '10'); // Default alert
            } else if (key === 'price') {
                // Ensure price goes to correct backend field if needed, but 'price' maps to undefined in backend currently?
                // Wait, backend 'price' issue (Step 531).
                // Backend schema has 'pricing.price'. 
                // Service adds 'pricing.price'. 
                // If I send 'price', backend `Medicine.create` sees `price` (not in schema).
                // Must send `pricing[price]`.
                data.append('pricing[price]', value);
                data.append('pricing[mrp]', (Number(value) * 1.2).toString()); // Mock MRP
                data.append('pricing[specialPrice]', value);
            } else {
                data.append(key, value);
            }
            if (files) {
                for (let i = 0; i < files.length; i++) {
                    data.append("images", files[i]);
                }
            }

            await medicineService.addMedicine(data);
            setShowAddModal(false);
            setFormData({ name: "", description: "", manufacturer: "", price: "", stock: "", dosageForm: "" });
            setFiles(null);
            loadMedicines(); // Refresh list
        } catch (err) {
            alert(getApiErrorMessage(err));
        } finally {
            setSubmissionLoading(false);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const filteredMedicines = medicines.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Medicine Inventory</h1>
                    <p className="text-gray-500 text-sm">Manage pharmacy stock and listings</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Medicine
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search medicines..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition"
                />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading inventory...</div>
            ) : filteredMedicines.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No medicines found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredMedicines.map((item) => (
                        <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition">
                            <div className="h-40 bg-gray-50 relative flex items-center justify-center">
                                {item.images && item.images.length > 0 ? (
                                    // Assuming backend returns full URL or we need to prepend base
                                    // Using a placeholder logic if backend logic is complex
                                    <img
                                        src={item.images[0]}
                                        alt={item.name}
                                        className="max-h-full max-w-full object-cover"
                                    />
                                ) : (
                                    <Pill className="w-12 h-12 text-gray-300" />
                                )}
                                <button
                                    onClick={() => handleDelete(item._id)}
                                    className="absolute top-2 right-2 p-2 bg-white/80 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                                <p className="text-xs text-gray-500 mb-2">{item.manufacturer || "Unknown Manufacturer"}</p>
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-cyan-700 font-bold">₹{item.price || 0}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${(item.stock?.totalQuantity || 0) > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                                        {(item.stock?.totalQuantity || 0) > 0 ? `${item.stock?.totalQuantity} in stock` : "Out of stock"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="font-bold text-lg">Add New Medicine</h2>
                            <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                            <div>
                                <label className="text-sm font-medium">Medicine Name</label>
                                <input required name="name" value={formData.name} onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Manufacturer</label>
                                <input name="manufacturer" value={formData.manufacturer} onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Price (₹)</label>
                                    <input required type="number" name="price" value={formData.price} onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Stock</label>
                                    <input required type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Dosage Form</label>
                                <input name="dosageForm" placeholder="Tablet, Syrup, etc." value={formData.dosageForm} onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Images (Max 5)</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => setFiles(e.target.files)}
                                    className="w-full border rounded-lg p-2 mt-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submissionLoading}
                                className="w-full bg-cyan-600 text-white py-3 rounded-lg font-semibold hover:bg-cyan-700 transition disabled:opacity-50 mt-4"
                            >
                                {submissionLoading ? "Adding..." : "Add Medicine"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
