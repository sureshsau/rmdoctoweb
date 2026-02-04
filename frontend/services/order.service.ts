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
        location: {
            type: "Point";
            coordinates: [number, number]; // [lng, lat]
        };
    };
    paymentMode: "COD" | "ONLINE" | "RM_CREDIT";
}

export interface OrderOverview {
    orderId: string;
    orderStatus: string;
    paymentStatus: string;
    paymentMode: string;
    payableAmount: number;
    createdAt: string;
    otp?: string | null;
    medicine: {
        name: string;
        image: string | null;
        quantity: number;
    } | null;
}

export interface OrderDetails {
    orderId: string;
    orderStatus: string;
    paymentStatus: string;
    paymentMode: string;
    pricing: {
        subtotal: number;
        gstTotal: number;
        payableAmount: number;
    };
    deliveryAddress: {
        fullName: string;
        phone: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        pincode: string;
    };
    deliveryAgent: {
        name: string | null;
        phone: string | null;
    } | null;
    items: {
        medicine: {
            id: string;
            name: string;
            brandName: string;
            dosageForm: string;
            image: string | null;
        };
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }[];
    otp: string | null;
    otpVerified: boolean;
    createdAt: string;
}

export const orderService = {
    async placeOrder(payload: OrderPayload) {
        const res = await apiClient.post("/medicine/order", payload);
        return res.data;
    },
    async getMyOrders(): Promise<{ success: boolean; data: OrderOverview[] }> {
        const res = await apiClient.get("/medicine/order");
        return res.data;
    },
    async getOrderDetails(orderId: string): Promise<{ success: boolean; data: OrderDetails }> {
        const res = await apiClient.get(`/medicine/order/${orderId}`);
        return res.data;
    }
};
