import { apiClient } from "@/lib/apiClient";
import { AuthUser } from "./auth.service";

export type GetAllUsersResponse = {
    success: boolean;
    message: string;
    count: number;
    data: AuthUser[];
};

export type CreateUserRequest = {
    name: string;
    phone: string;
    email?: string;
    password?: string;
    dashboard?: string;
    roles?: string[];
    permissions?: string[];
};

export const userService = {
    async getAllUsers() {
        const res = await apiClient.get<GetAllUsersResponse>("/user");
        // Map rmCoinsBalance to rmcredit for UI compatibility
        const mapped = {
            ...res.data,
            data: res.data.data.map((user: any) => ({
                ...user,
                rmcredit: user.rmCoinsBalance ?? user.rmcredit ?? 0,
            })),
        };
        return mapped;
    },

    async createUser(payload: CreateUserRequest) {
        const res = await apiClient.post("/user", payload);
        return res.data;
    },

    async bookAppointment(payload: any) {
        const res = await apiClient.post("/appointment", payload);
        return res.data;
    },

    async getAllDoctors() {
        const res = await apiClient.get<GetAllUsersResponse>("/user/doctors");
        return res.data;
    },
};
