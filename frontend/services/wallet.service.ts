import { apiClient } from "@/lib/apiClient";

export const walletService = {
  async getWalletLogs({ page = 1, limit = 10, search = "" }) {
    const params = new URLSearchParams({ 
      page: String(page), 
      limit: String(limit) 
    });
    if (search) params.append("search", search);
    const res = await apiClient.get(`/rmcoin/logs/me?${params}`);
    return res;
  },

  async transferToAdmin(amount: number) {
    const res = await apiClient.post("/rmcoin/transfer-to-admin", { amount });
    return res;
  },

  async getAdminRMCoinsLogs(userId?: string) {
    const params = userId ? `?userId=${userId}` : '';
    const res = await apiClient.get(`/rmcoin/admin/logs${params}`);
    return res;
  },

  async adminRecharge(amount: number) {
    const res = await apiClient.post("/rmcoin/admin/recharge", { amount });
    return res;
  },

  async adminTransferToUser(receiverId: string, amount: number) {
    const res = await apiClient.post("/rmcoin/admin-transfer", { receiverId, amount });
    return res;
  }
};