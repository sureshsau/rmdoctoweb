import { apiClient } from "@/lib/apiClient";

export type AuthUser = {
  id?: string;
  _id?: string;
  name: string;
  phone?: string;
  email?: string | null;
  dashboard?: string;
  roles?: string[];
  permissions?: string[];
  identifier?: string;
  isActive?: boolean;
  kycStatus?: "none" | "pending" | "verified" | "rejected";
  rmcredit?: number; // RMDoctoCoin balance (legacy)
  rmCoinsBalance?: number; // RMDoctoCoin balance (new)
  specialty?: string;
  available?: boolean;
};

export type LoginRequest = {
  phone: string;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  user: AuthUser;
  token: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type RegisterResponse = {
  success: boolean;
  message: string;
  phone?: string;
  identifier?: string;
};

export type VerifyOtpRequest = {
  identifier: string;
  otp: string;
};

export type VerifyOtpResponse = {
  success: boolean;
  message: string;
  user: AuthUser;
  token: string;
};


export const authService = {
  async login(payload: LoginRequest) {
    const res = await apiClient.post<LoginResponse>("/login/send-otp", payload);
    return res.data;
  },
  async verfiyOtp(payload: VerifyOtpRequest){
    const res = await apiClient.post<VerifyOtpResponse>("/login/verify-otp", payload);
    return res;
  }
};
