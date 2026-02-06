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
        deliveryCharge: number;
        payableAmount: number;
    };
    deliveryAddress: {
        fullName: string;
        phone: string;
        addressLine1: string;
        addressLine2?: string;
        city?: string;
        state?: string;
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
        gstPercentage: number;
        gstAmount: number;
        totalPrice: number;
    }[];
    otp: string | number | null;
    otpVerified: boolean;
    createdAt: string;
}

export type AllOrdersResponse = {
    success: boolean;
    data: OrderOverview[];
    meta?: {
        fallback: boolean;
        errorStatus?: number;
        errorMessage?: string;
    };
};

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
        // Encode to avoid invalid path segments if an unexpected value slips in
        const safeId = encodeURIComponent(orderId);
        const res = await apiClient.get(`/medicine/order/${safeId}`);
        return res.data;
    },
    async getMarketingAgentOrders(): Promise<AllOrdersResponse> {
        try {
            const res = await apiClient.get("/marketing-agent/medicine/oderes");
            return { ...res.data, meta: { fallback: false } };
        } catch (err: any) {
            const status = err?.response?.status;
            const message = err?.response?.data?.message || err?.message;
            console.error("getMarketingAgentOrders failed", err);
            console.error("getMarketingAgentOrders response", {
                status,
                statusText: err?.response?.statusText,
                data: err?.response?.data,
                message: err?.message
            });
            return {
                success: false,
                data: [],
                meta: {
                    fallback: false,
                    errorStatus: status,
                    errorMessage: message
                }
            };
        }
    },
    async getAllOrders(params?: Record<string, string | number | undefined>): Promise<AllOrdersResponse> {
        // Prefer full admin view; if it fails (400/403/404), fall back to user-scoped overview.
        try {
            const res = await apiClient.get("/medicine/order/view/all", { params });
            return { ...res.data, meta: { fallback: false } };
        } catch (err: any) {
            const status = err?.response?.status;
            const message = err?.response?.data?.message || err?.message;
            console.error("getAllOrders view/all failed", {
                status,
                statusText: err?.response?.statusText,
                data: err?.response?.data,
                message: err?.message
            });

            try {
                const res = await apiClient.get("/medicine/order", { params });
                return { ...res.data, meta: { fallback: true, errorStatus: status, errorMessage: message } };
            } catch (innerErr: any) {
                console.error("Failed to load orders", innerErr);
                const innerStatus = innerErr?.response?.status;
                const innerMessage = innerErr?.response?.data?.message || innerErr?.message;
                console.error("getAllOrders fallback failed", {
                    status: innerStatus,
                    statusText: innerErr?.response?.statusText,
                    data: innerErr?.response?.data,
                    message: innerErr?.message
                });
                return {
                    success: false,
                    data: [],
                    meta: {
                        fallback: true,
                        errorStatus: innerStatus ?? status,
                        errorMessage: innerMessage ?? message
                    }
                };
            }
        }
    }
};
