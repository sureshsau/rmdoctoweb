import { apiClient } from "@/lib/apiClient";

export type RegisterAgentRequest = {
    agentName: string;
    phone: string;
    password?: string;
    latitude: number;
    longitude: number;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    parentAgentId?: string | null;
};

export interface AgentProfile {
    _id: string;
    userId: string;
    agentName: string;
    phone: string;
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    kyc: {
        status: "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "REJECTED";
        aadhaarNumber?: string;
        panNumber?: string;
    };
    agreement: {
        verificationStatus: "NOT_UPLOADED" | "PENDING" | "APPROVED" | "REJECTED";
    };
}

export interface HierarchyData {
    type: "AGENT" | "MARKETING_AGENT";
    totalAgents: number;
    agents: any[];
    roots?: any[];
}

export const agentService = {
    async registerAgent(payload: RegisterAgentRequest) {
        const res = await apiClient.post("/agent/register", payload);
        return res.data;
    },
    async getHierarchy(): Promise<{ success: boolean; data: HierarchyData }> {
        try {
            const res = await apiClient.get(`/agent/network`, {
                headers: { 'Cache-Control': 'no-cache' }
            });
            return res.data;
        } catch (err: any) {
            if (err?.response?.status === 404) {
                return {
                    success: true,
                    data: {
                        type: "AGENT",
                        totalAgents: 0,
                        agents: [],
                        roots: []
                    }
                };
            }
            throw err;
        }
    },
    async uploadAgreement(formData: FormData) {
        const res = await apiClient.post("/agent/agreement/upload", formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    }
};
