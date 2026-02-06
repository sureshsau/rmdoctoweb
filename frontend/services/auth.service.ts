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
};

export type LoginRequest = {
  email?: string;
  phone: string;
  password: string;
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

export type ForgotSendOtpRequest = {
  identifier: string;
  type: "email" | "phone";
};

export type ForgotVerifyOtpRequest = {
  identifier: string;
  type: "email" | "phone";
  otp: string;
};

export type ResetPasswordRequest = {
  identifier: string;
  type: "email" | "phone";
  newPassword: string;
};

export const authService = {
  async login(payload: LoginRequest) {
    const res = await apiClient.post<LoginResponse>("/auth/login", payload);
    return res.data;
  },

  async register(payload: RegisterRequest) {
    const res = await apiClient.post<RegisterResponse>("/auth/register", payload);
    return res.data;
  },

  async verifyOtp(payload: VerifyOtpRequest) {
    const res = await apiClient.post<VerifyOtpResponse>("/auth/verifyotp", payload);
    return res.data;
  },

  async resendOtp(identifier: string) {
    const res = await apiClient.post("/auth/resend-otp", { identifier });
    return res.data;
  },

  async forgotPasswordSendOtp(payload: ForgotSendOtpRequest) {
    const res = await apiClient.post("/auth/forgot-password/send-otp", payload);
    return res.data;
  },

  async forgotPasswordVerifyOtp(payload: ForgotVerifyOtpRequest) {
    const res = await apiClient.post("/auth/forgot-password/verify-otp", payload);
    return res.data;
  },

  async resetPassword(payload: ResetPasswordRequest) {
    const res = await apiClient.post("/auth/forgot-password/reset", payload);
    return res.data;
  },
};
