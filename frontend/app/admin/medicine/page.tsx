"use client";

import { useEffect, useMemo, useState } from "react";
import { Pill, Plus, Trash2, Search, X, Image as ImageIcon, Upload, AlertCircle, XCircle, Edit2 } from "lucide-react";
import { medicineService, Medicine } from "@/services/medicine.service";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import Image from "next/image";

export default function AdminMedicinePage() {
    const DEFAULT_PRESCRIPTION_TYPE = "RX";
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submissionLoading, setSubmissionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        manufacturer: "",
        price: "",
        mrp: "",
        specialPrice: "",
        stock: "",
        minAlertQuantity: "",
        dosageForm: "",
        brandName: "",
    });
    const [selectedImages, setSelectedImages] = useState<{ file: File; url: string }[]>([]);
    const [formError, setFormError] = useState<string>("");
    const [banner, setBanner] = useState<{ type: "error" | "success"; message: string } | null>(null);

    useEffect(() => {
        loadMedicines();
    }, []);

    async function loadMedicines() {
        setLoading(true);
        try {
            const res = await medicineService.getAllMedicines({ limit: 50 });
            if (res.data && Array.isArray(res.data)) {
                setMedicines(res.data);
            }
        } catch (err) {
            console.error("Failed to load medicines", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        setBanner(null);
        try {
            await medicineService.deleteMedicine(id);
            setMedicines(prev => prev.filter(m => m._id !== id));
            setBanner({ type: "success", message: "Medicine deleted" });
        } catch (err) {
            setBanner({ type: "error", message: getApiErrorMessage(err) });
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError("");
        setBanner(null);

        if (!formData.name.trim()) {
            setFormError("Name is required");
            return;
        }
        if (!formData.price) {
            setFormError("Price is required");
            return;
        }
        if (!formData.dosageForm) {
            setFormError("Dosage form is required");
            return;
        }
        if (selectedImages.length > 5) {
            setFormError("Maximum 5 images allowed");
            return;
        }

        setSubmissionLoading(true);
        try {
            const basePayload: any = {
                name: formData.name,
                brandName: formData.brandName || undefined,
                dosageForm: formData.dosageForm,
                prescriptionType: DEFAULT_PRESCRIPTION_TYPE,
                pricing: {
                    price: Number(formData.price || 0),
                    mrp: Number(formData.mrp || formData.price || 0),
                    specialPrice: Number(formData.specialPrice || formData.price || 0),
                },
            };

            if (formData.manufacturer) {
                basePayload.manufacturer = { name: formData.manufacturer };
            }

            const stockPayload: Record<string, number> = {};
            if (formData.stock) stockPayload.totalQuantity = Number(formData.stock);
            if (formData.minAlertQuantity) stockPayload.minAlertQuantity = Number(formData.minAlertQuantity);
            if (Object.keys(stockPayload).length > 0) {
                basePayload.stock = stockPayload;
            }

            if (editingId) {
                await medicineService.updateMedicine(editingId, basePayload);
                setBanner({ type: "success", message: "Medicine updated" });
            } else {
                const data = new FormData();
                Object.entries(basePayload).forEach(([key, value]) => {
                    if (value === undefined) return;
                    if (key === "pricing" || key === "stock" || key === "manufacturer") {
                        data.append(key, JSON.stringify(value));
                    } else {
                        data.append(key, String(value));
                    }
                });
                selectedImages.forEach(({ file }) => data.append("images", file));
                await medicineService.addMedicine(data);
                setBanner({ type: "success", message: "Medicine added" });
            }

            setShowAddModal(false);
            setFormData({ name: "", manufacturer: "", price: "", mrp: "", specialPrice: "", stock: "", minAlertQuantity: "", dosageForm: "", brandName: "" });
            setSelectedImages([]);
            setEditingId(null);
            loadMedicines();
        } catch (err) {
            setFormError(getApiErrorMessage(err));
        } finally {
            setSubmissionLoading(false);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const incoming = Array.from(files).slice(0, 5 - selectedImages.length);
        const previews = incoming.map(file => ({ file, url: URL.createObjectURL(file) }));
        setSelectedImages(prev => [...prev, ...previews]);
        e.target.value = ""; // allow reselecting the same files
    };

    const handleRemoveImage = (url: string) => {
        setSelectedImages(prev => prev.filter(img => img.url !== url));
        URL.revokeObjectURL(url);
    };

    const imageCountLabel = useMemo(() => `${selectedImages.length}/5`, [selectedImages.length]);

    const filteredMedicines = medicines.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalCount = medicines.length;
    const visibleCount = filteredMedicines.length;
    const lowStockCount = medicines.filter(m => (m.stock as any)?.totalQuantity !== undefined && Number((m.stock as any)?.totalQuantity) <= Number((m.stock as any)?.minAlertQuantity ?? 0)).length;

    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

    const resolveImage = (img: any): string | null => {
        if (!img) return null;
        const raw = img.url || img.path || img.location || img.src || img;
        if (!raw) return null;
        if (typeof raw !== "string") return null;
        if (raw.startsWith("http")) return raw;
        const normalized = raw.startsWith("/") ? raw : `/${raw}`;
        return `${apiBase}${normalized}`;
    };

    return (
        <div className="space-y-6">
            {banner && (
                <div className={`flex items-center justify-between px-4 py-3 rounded-lg border ${banner.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <AlertCircle className="w-4 h-4" />
                        <span>{banner.message}</span>
                    </div>
                    <button onClick={() => setBanner(null)} className="text-xs underline">Dismiss</button>
                </div>
            )}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-700 font-semibold">Inventory</p>
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Medicine Catalog</h1>
                        <p className="text-gray-500 text-sm">Monitor stock, pricing, and visibility</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm">
                            <span className="text-gray-700 font-semibold">{visibleCount}</span> showing
                            <span className="w-px h-4 bg-gray-200" />
                            <span className="text-gray-700 font-semibold">{totalCount}</span> total
                        </div>
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setFormData({ name: "", manufacturer: "", price: "", mrp: "", specialPrice: "", stock: "", minAlertQuantity: "", dosageForm: "", brandName: "" });
                                setSelectedImages([]);
                                setFormError("");
                                setShowAddModal(true);
                            }}
                            className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2.5 rounded-lg hover:bg-cyan-700 transition shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Medicine
                        </button>
                    </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                    <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                        <p className="text-xs text-gray-500">Total SKUs</p>
                        <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                        <p className="text-xs text-gray-500">Visible Now</p>
                        <div className="text-2xl font-bold text-cyan-700">{visibleCount}</div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                        <p className="text-xs text-gray-500">Low Stock Alerts</p>
                        <div className="text-2xl font-bold text-amber-600">{lowStockCount}</div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 md:items-center">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition bg-white shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading inventory...</div>
            ) : filteredMedicines.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No medicines found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {filteredMedicines.map((item) => (
                        <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-lg transition flex flex-col">
                            <div className="relative h-44 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                                {(() => {
                                    const resolved = resolveImage((item as any).image || (item.images && item.images[0]));
                                    return resolved ? (
                                        <img
                                            src={resolved}
                                            alt={item.name}
                                            className="max-h-full max-w-full object-contain drop-shadow-sm"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <Pill className="w-12 h-12 text-gray-300" />
                                    );
                                })()}

                                <div className="absolute left-3 top-3 flex gap-2">
                                    {item.dosageForm && (
                                        <span className="text-[11px] px-2 py-1 rounded-full bg-white/90 border border-gray-200 text-gray-700 font-semibold uppercase tracking-wide">{item.dosageForm}</span>
                                    )}
                                    {item.brandName && (
                                        <span className="text-[11px] px-2 py-1 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-700 font-semibold">{item.brandName}</span>
                                    )}
                                </div>

                                <div className="absolute right-3 top-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold text-cyan-700 shadow-sm">
                                    ₹{item.pricing?.price ?? item.price ?? 0}
                                </div>

                                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                        onClick={() => {
                                            setEditingId(item._id);
                                            setFormError("");
                                            setBanner(null);
                                            setSelectedImages([]);
                                            setFormData({
                                                name: item.name || "",
                                                manufacturer: typeof item.manufacturer === "string" ? item.manufacturer : item.manufacturer?.name || (item as any).manufacturerName || "",
                                                brandName: item.brandName || "",
                                                dosageForm: item.dosageForm || "",
                                                price: String(item.pricing?.price ?? (item as any).price ?? ""),
                                                mrp: String(item.pricing?.mrp ?? (item as any).mrp ?? ""),
                                                specialPrice: String(item.pricing?.specialPrice ?? (item as any).specialPrice ?? ""),
                                                stock: String((item as any).stock?.totalQuantity ?? ""),
                                                minAlertQuantity: String((item as any).stock?.minAlertQuantity ?? ""),
                                            });
                                            setShowAddModal(true);
                                        }}
                                        className="p-2 bg-white/90 rounded-full text-cyan-600 hover:bg-cyan-50 shadow-sm"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        className="p-2 bg-white/90 rounded-full text-red-500 hover:bg-red-50 shadow-sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-900 truncate" title={item.name}>{item.name}</h3>
                                        <p className="text-xs text-gray-500 truncate">{(() => {
                                            const manufacturerName = typeof item.manufacturer === "string"
                                                ? item.manufacturer
                                                : item.manufacturer?.name || (item as any).manufacturerName;
                                            return manufacturerName || item.brandName || "Manufacturer not provided";
                                        })()}</p>
                                    </div>
                                    <div className="text-right text-xs text-gray-500 space-y-0.5 shrink-0">
                                        {item.pricing?.mrp && <div className="line-through text-gray-400">MRP ₹{item.pricing.mrp}</div>}
                                        {item.pricing?.specialPrice && <div className="text-emerald-600 font-semibold">Agent ₹{item.pricing.specialPrice}</div>}
                                    </div>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-cyan-50 to-white">
                            <div>
                                <p className="text-xs uppercase tracking-[0.15em] text-cyan-700 font-semibold">{editingId ? "Edit Listing" : "New Listing"}</p>
                                <h2 className="font-bold text-lg text-gray-900">{editingId ? "Update Medicine" : "Add Medicine"}</h2>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Medicine Name</label>
                                            <input required name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 mt-1 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" placeholder="e.g., Paracetamol 500mg" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Dosage Form</label>
                                            <select
                                                name="dosageForm"
                                                value={formData.dosageForm}
                                                onChange={handleChange}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 mt-1 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white"
                                            >
                                                <option value="" disabled>Select type</option>
                                                <option value="Tablet">Tablet</option>
                                                <option value="Capsule">Capsule</option>
                                                <option value="Syrup">Syrup</option>
                                                <option value="Injection">Injection</option>
                                                <option value="Ointment">Ointment</option>
                                                <option value="Drops">Drops</option>
                                                <option value="Inhaler">Inhaler</option>
                                                <option value="Suspension">Suspension</option>
                                                <option value="Powder">Powder</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Manufacturer</label>
                                            <input name="manufacturer" value={formData.manufacturer} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 mt-1 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" placeholder="e.g., Cipla" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Brand (optional)</label>
                                            <input name="brandName" value={formData.brandName} onChange={(e) => setFormData(prev => ({ ...prev, brandName: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 mt-1 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" placeholder="e.g., Crocin" />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Price (₹)</label>
                                            <input required type="number" min="0" name="price" value={formData.price} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 mt-1 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                                            <p className="text-[11px] text-gray-500 mt-1">Customer selling price</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">MRP (₹)</label>
                                            <input type="number" min="0" name="mrp" value={formData.mrp} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 mt-1 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" placeholder="Defaults to price" />
                                            <p className="text-[11px] text-gray-500 mt-1">Shown struck-through</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Agent Price (₹)</label>
                                            <input type="number" min="0" name="specialPrice" value={formData.specialPrice} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 mt-1 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" placeholder="Optional" />
                                            <p className="text-[11px] text-gray-500 mt-1">Visible for agents/admins</p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Stock (optional)</label>
                                            <input type="number" min="0" name="stock" value={formData.stock} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 mt-1 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" placeholder="Leave blank if unknown" />
                                            <p className="text-[11px] text-gray-500 mt-1">Sends only if filled</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Low Stock Alert (optional)</label>
                                            <input type="number" min="0" name="minAlertQuantity" value={formData.minAlertQuantity} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 mt-1 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" placeholder="Leave blank to skip" />
                                            <p className="text-[11px] text-gray-500 mt-1">Sends only if filled</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="border border-dashed border-cyan-200 rounded-xl bg-cyan-50/50 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">Images</p>
                                                <p className="text-[11px] text-gray-500">Up to 5 images. First one shows on cards. (Images can be added only when creating)</p>
                                            </div>
                                            <span className="text-xs font-semibold text-cyan-700 bg-white px-3 py-1 rounded-full border border-cyan-100">{imageCountLabel}</span>
                                        </div>

                                        <label className={`mt-3 flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg py-6 bg-white transition ${editingId ? "opacity-60 cursor-not-allowed" : "hover:border-cyan-400 cursor-pointer"}`}>
                                            <ImageIcon className="w-8 h-8 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700 mt-2">Upload or drag files</span>
                                            <span className="text-[11px] text-gray-500">PNG, JPG up to 5MB</span>
                                            {!editingId && <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />}
                                        </label>

                                        {selectedImages.length > 0 && (
                                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
                                                {selectedImages.map(img => (
                                                    <div key={img.url} className="relative group aspect-square rounded-lg overflow-hidden bg-white border border-gray-200">
                                                        <img src={img.url} alt="preview" className="object-cover w-full h-full" />
                                                        <button type="button" onClick={() => handleRemoveImage(img.url)} className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition">
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-3 leading-relaxed">
                                        <div className="flex items-center gap-2 font-semibold text-gray-700 mb-1 text-sm"><AlertCircle className="w-4 h-4 text-amber-500" />Quality tips</div>
                                        Use bright product shots on white background. Include front label and composition if possible.
                                    </div>
                                </div>
                            </div>

                            {formError && <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2"><AlertCircle className="w-4 h-4" />{formError}</div>}

                            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={submissionLoading} className="px-5 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-60 flex items-center gap-2 shadow-sm">
                                    {submissionLoading ? "Saving..." : <><Upload className="w-4 h-4" /> {editingId ? "Update" : "Save"} Medicine</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
