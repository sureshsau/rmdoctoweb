import { apiClient } from "@/lib/apiClient";

export type RegisterAgentRequest = {
    name: string;
    phone: string;
    email?: string;
    password?: string;
    panCard?: string;
    aadhaarCard?: string;
};

export const agentService = {
    async registerAgent(payload: RegisterAgentRequest) {
        const res = await apiClient.post("/agent/register", payload);
        return res.data;
    },
};
