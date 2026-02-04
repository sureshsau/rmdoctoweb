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
        return res.data;
    },

    async createUser(payload: CreateUserRequest) {
        const res = await apiClient.post("/user", payload);
        return res.data;
    },
};
