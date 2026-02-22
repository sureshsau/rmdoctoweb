import { apiClient } from "@/lib/apiClient";

export const rmcreditService = {
  async getAdminLogs(agentId?: string) {
    try {
      const url = agentId 
        ? `/rmcredit/admin/${agentId}` 
        : "/rmcredit/admin/logs";
      
      console.log("Fetching RM Credits from:", url);
      
      const res = await apiClient.get(url);
      return res; // Return full response
    } catch (error: any) {
      console.error("RM Credits API Error:", {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  async getMyCreditDetails() {
    try {
      const res = await apiClient.get("/rmcredit/my");
      return res;
    } catch (error) {
      console.error("Error fetching my credit details:", error);
      throw error;
    }
  },

  async addCredit(agentId: string, amount: number, expiryDate: string, description?: string) {
    try {
      const res = await apiClient.post("/rmcredit", { 
        agentId, 
        amount, 
        expiryDate, 
        description 
      });
      return res;
    } catch (error) {
      console.error("Error adding credit:", error);
      throw error;
    }
  },

  async requestRevokeCredit(agentId: string, amount: number) {
    try {
      const res = await apiClient.post("/rmcredit/revoke/request", { 
        agentId, 
        amount 
      });
      return res;
    } catch (error) {
      console.error("Error requesting revoke:", error);
      throw error;
    }
  },

  async verifyRevokeCredit(agentId: string, otp: string) {
    try {
      const res = await apiClient.post("/rmcredit/revoke/verify", { 
        agentId, 
        otp 
      });
      return res;
    } catch (error) {
      console.error("Error verifying revoke:", error);
      throw error;
    }
  },

  async getAgentCreditDetails(agentId: string) {
    try {
      const res = await apiClient.get(`/rmcredit/admin/${agentId}`);
      return res;
    } catch (error) {
      console.error("Error fetching agent credit details:", error);
      throw error;
    }
  }
};