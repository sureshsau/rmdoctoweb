import { apiClient } from "@/lib/apiClient";

export interface OrderPayload {
    items: {
        medicineId: string;
        quantity: number;
    }[];
    deliveryAddress: {
        fullName: string;
        phone: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        pincode: string;
        location?: {
            coordinates: [number, number]; // [lng, lat]
        };
    };
    paymentMode: "COD" | "ONLINE";
}

export const orderService = {
    async placeOrder(payload: OrderPayload) {
        // Send to /orders endpoint (Assuming it will be created or exists)
        const res = await apiClient.post("/orders", payload);
        return res.data;
    }
};
