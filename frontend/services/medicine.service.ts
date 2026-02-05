import { apiClient } from "@/lib/apiClient";

export type Medicine = {
    _id: string;
    name: string;
    brandName?: string;
    description?: string;

    // Categorization
    tags?: string[];
    therapeuticUse?: string;
    dosageForm?: string; // Tablet, Capsule, etc.
    prescriptionType?: "OTC" | "RX";

    // Composition
    composition?: Array<{ ingredient: string; strength: string }>;

    // Pricing
    pricing?: {
        mrp: number;
        price: number;
        specialPrice: number;
    };
    gstPercentage?: number;

    // Stock
    stock?: {
        totalQuantity: number;
        minAlertQuantity: number;
    };

    // Batches
    batches?: Array<{
        batchNumber: string;
        expiryDate: string; // ISO date string
        quantity: number;
    }>;

    // Manufacturer
    manufacturer?: {
        name: string;
        licenseNumber?: string;
        address?: string;
    };

    // Media
    images?: Array<{
        url: string;
        key: string;
    }>;

    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
};

// Types for the simplified backend response
interface BackendMedicineSummary {
    _id: string;
    name: string;
    brandName?: string;
    dosageForm?: string;
    price?: number;
    mrp?: number;
    specialPrice?: number;
    image?: string;
}

export interface PaginatedResponse {
    data: Medicine[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// Backend expects FormData for creation because of image upload
export const medicineService = {
    async getAllMedicines(params?: {
        page?: number;
        limit?: number;
        search?: string;
        dosageForm?: string
    }): Promise<PaginatedResponse> {

        const { page = 1, limit = 10, search = "", dosageForm = "" } = params || {};

        // Build query string
        const query = new URLSearchParams();
        query.append("page", page.toString());
        query.append("limit", limit.toString());
        if (search) query.append("search", search);
        if (dosageForm && dosageForm !== "All") query.append("dosageForm", dosageForm);

        // NOTE: app.js mounts at "/medicines", so that is correct.
        const res = await apiClient.get<any>(`/medicines?${query.toString()}`);

        const data: Medicine[] = res.data.data || [];
        const pagination = res.data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

        return { data, pagination };
    },

    async getMedicineById(id: string): Promise<Medicine> {
        const res = await apiClient.get<any>(`/medicines/${id}`);
        return res.data.data;
    },

    async getRelatedMedicines(medicine: Medicine): Promise<Medicine[]> {
        // Find medicines with same therapeuticUse or dosageForm
        const search = medicine.therapeuticUse || medicine.dosageForm || "";
        const res = await this.getAllMedicines({
            search,
            limit: 11 // Fetch 11 to exclude current one if it appears
        });

        return res.data.filter(m => m._id !== medicine._id).slice(0, 10);
    },

    async addMedicine(formData: FormData) {
        const res = await apiClient.post("/medicines", formData); // let axios set multipart boundary
        return res.data;
    },

    async deleteMedicine(id: string) {
        const res = await apiClient.delete(`/medicines/${id}`);
        return res.data;
    },

    async updateMedicine(id: string, data: Partial<Medicine>) {
        const res = await apiClient.put(`/medicines/${id}`, data);
        return res.data;
    },
};
