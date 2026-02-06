import { apiClient } from "@/lib/apiClient";

export type MarketingAgentRegisterRequest = {
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

export type MarketingAgentNode = {
  id: string;
  name: string;
  phone: string;
  level: number;
  children: MarketingAgentNode[];
};

export type MarketingAgentNetworkResponse = {
  success: boolean;
  data: {
    tree: MarketingAgentNode[];
  };
};

export const marketingAgentService = {
  async getNetwork(): Promise<MarketingAgentNetworkResponse> {
    const res = await apiClient.get("/marketing-agent/network");
    return res.data;
  },

  async registerAgent(payload: MarketingAgentRegisterRequest) {
    const res = await apiClient.post("/marketing-agent/register/agent", payload);
    return res.data;
  }
};
