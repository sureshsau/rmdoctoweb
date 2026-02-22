import { apiClient } from "@/lib/apiClient";

export type Permission = {
    key: string;
    label: string;
    category: string;
};

export const permissionService = {
    async getAll() {
        const res = await apiClient.get<{ success: boolean; count: number; permissions: Record<string, { label: string; permissions: Record<string, string> }> }>("/permission");
        const raw = res.data.permissions || {};

        const flattened: Permission[] = Object.entries(raw).flatMap(([category, value]) => {
            const label = value.label || category;
            const perms = value.permissions || {};
            return Object.entries(perms).map(([permKey, permLabel]) => ({
                key: permKey,
                label: permLabel,
                category: label,
            }));
        });

        return { success: res.data.success, count: flattened.length, data: flattened };
    },
};
