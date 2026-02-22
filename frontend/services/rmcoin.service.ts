// Service for RM Coin transfer (admin to user)
import { apiClient } from "@/lib/apiClient";

export const rmcoinService = {
    async adminTransferToUser(receiverId: string, amount: number) {
        return apiClient.post("/rmcoin/admin-transfer", { receiverId, amount });
    }
};
