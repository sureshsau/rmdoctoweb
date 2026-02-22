import { apiClient } from "@/lib/apiClient";

export const rmcreditService = {
  async getAdminLogs(agentId?: string) {
    try {
      const url = agentId 
        ? `/rmcredit/admin/${agentId}` 
        : "/rmcredit/admin/logs";
      
      const res = await apiClient.get(url);
      return res;
    } catch (error: any) {
      console.error("RM Credits API Error:", {
        message: error?.message || "Unknown error",
        status: error?.response?.status,
        data: error?.response?.data,
        url: error?.config?.url
      });
      throw error;
    }
  },

  async getMyCreditDetails() {
    try {
      const res = await apiClient.get("/rmcredit/my");
      return res;
    } catch (error: any) {
      // If it's 404 (wallet not found), return empty wallet data
      if (error?.response?.status === 404) {
        console.log("No wallet found - returning empty data");
        return {
          data: {
            success: true,
            data: {
              wallet: {
                balance: 0,
                totalCredit: 0,
                usedCredit: 0,
                revokeOtp: null,
                revokeOtpExpiresAt: null,
                revokeAmount: null,
                expiryDate: null,
                status: null
              },
              transactions: []
            }
          }
        };
      }
      
      // For other errors, return empty data
      return {
        data: {
          success: true,
          data: {
            wallet: {
              balance: 0,
              totalCredit: 0,
              usedCredit: 0,
              revokeOtp: null,
              revokeOtpExpiresAt: null,
              revokeAmount: null,
              expiryDate: null,
              status: null
            },
            transactions: []
          }
        }
      };
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
    } catch (error: any) {
      console.error("Error adding credit:", {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
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
    } catch (error: any) {
      console.error("Error requesting revoke:", {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
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
    } catch (error: any) {
      console.error("Error verifying revoke:", {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
      throw error;
    }
  },

  async getAgentCreditDetails(agentId: string) {
    try {
      const res = await apiClient.get(`/rmcredit/admin/${agentId}`);
      return res;
    } catch (error: any) {
      // If it's 404 (wallet not found), return empty wallet data
      if (error?.response?.status === 404) {
        console.log("No wallet found for agent - returning empty data");
        return {
          data: {
            success: true,
            data: {
              wallet: {
                balance: 0,
                totalCredit: 0,
                usedCredit: 0,
                revokeOtp: null,
                revokeOtpExpiresAt: null,
                revokeAmount: null,
                expiryDate: null,
                status: null
              },
              transactions: []
            }
          }
        };
      }
      
      // For other errors, log and return empty data
      console.error("Error fetching agent credit details:", error?.message);
      return {
        data: {
          success: true,
          data: {
            wallet: {
              balance: 0,
              totalCredit: 0,
              usedCredit: 0,
              revokeOtp: null,
              revokeOtpExpiresAt: null,
              revokeAmount: null,
              expiryDate: null,
              status: null
            },
            transactions: []
          }
        }
      };
    }
  }
};