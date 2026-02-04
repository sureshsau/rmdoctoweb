import { apiClient } from "@/lib/apiClient";

export type Role = {
    _id: string;
    key: string;
    name: string;
    permissions: string[];
};

export type CreateRoleRequest = {
    key: string;
    name: string;
    permissions: string[];
};

export const roleService = {
    async getAllRoles() {
        // Backend returns { success: true, count: number, data: Role[] }
        const res = await apiClient.get<{ success: boolean; data: Role[] }>("/roles");
        return res.data;
    },

    async createRole(payload: CreateRoleRequest) {
        const res = await apiClient.post("/roles", payload);
        return res.data;
    },
};
