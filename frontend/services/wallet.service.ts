import { apiClient } from "@/lib/apiClient";

export const walletService = {
  async getWalletLogs({ page = 1, limit = 10, search = "" }) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append("search", search);
    const res = await apiClient.get(`/rmcoin/logs/me?${params}`);
    return res.data;
  },
  async transferToAdmin(amount: number) {
    const res = await apiClient.post("/rmcoin/transfer-to-admin", { amount });
    return res.data;
  },
};
