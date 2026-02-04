"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authService, type AuthUser, type LoginRequest, type RegisterRequest } from "@/services/auth.service";
import { getDecodedToken, getValidToken } from "@/lib/auth";
import { DASHBOARD_ROUTE_MAP, getDashboardPathForUser } from "@/lib/roleRoutes";

type ForgotType = "email" | "phone";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;

  login: (payload: LoginRequest, redirectTo?: string) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<{ identifier: string }>;
  verifyRegisterOtp: (payload: { identifier: string; otp: string }, redirectTo?: string) => Promise<void>;

  sendForgotPasswordOtp: (payload: { identifier: string; type: ForgotType }) => Promise<void>;
  verifyForgotPasswordOtp: (payload: { identifier: string; type: ForgotType; otp: string }) => Promise<void>;
  resetPassword: (payload: { identifier: string; type: ForgotType; newPassword: string }) => Promise<void>;

  logout: (opts?: { redirectTo?: string }) => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function persistSession(token: string, user: AuthUser) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(() => {
    const validToken = getValidToken();
    const storedUser = readStoredUser();

    setToken(validToken);
    setUser(validToken ? storedUser : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(
    (opts?: { redirectTo?: string }) => {
      clearSession();
      setToken(null);
      setUser(null);
      const redirectTo = opts?.redirectTo ?? "/";
      router.replace(redirectTo);
    },
    [router]
  );

  const login = useCallback(
    async (payload: LoginRequest, redirectTo?: string) => {
      const data = await authService.login(payload);
      persistSession(data.token, data.user);
      setToken(data.token);
      setUser(data.user);

      const target = redirectTo || getDashboardPathForUser(data.user);
      router.replace(target);
    },
    [router]
  );

  const register = useCallback(async (payload: RegisterRequest) => {
    const data = await authService.register(payload);
    const identifier = (data.identifier || payload.phone || "").trim();
    if (!identifier) throw new Error("Missing identifier from register response");
    return { identifier };
  }, []);

  const verifyRegisterOtp = useCallback(
    async (payload: { identifier: string; otp: string }, redirectTo?: string) => {
      const data = await authService.verifyOtp(payload);
      persistSession(data.token, data.user);
      setToken(data.token);
      setUser(data.user);

      const target = redirectTo || getDashboardPathForUser(data.user);
      router.replace(target);
    },
    [router]
  );

  const sendForgotPasswordOtp = useCallback(async (payload: { identifier: string; type: ForgotType }) => {
    await authService.forgotPasswordSendOtp(payload);
  }, []);

  const verifyForgotPasswordOtp = useCallback(async (payload: { identifier: string; type: ForgotType; otp: string }) => {
    await authService.forgotPasswordVerifyOtp(payload);
  }, []);

  const resetPassword = useCallback(async (payload: { identifier: string; type: ForgotType; newPassword: string }) => {
    await authService.resetPassword(payload);
  }, []);

  // Global session expiry check (token exp)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const interval = window.setInterval(() => {
      const decoded = getDecodedToken();
      if (!decoded) {
        // token invalid/expired and already cleared by getValidToken
        if (token || user) logout({ redirectTo: "/auth/login" });
      }
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [logout, token, user]);

  // If user navigates to an auth route while authenticated, prefer dashboard.
  useEffect(() => {
    if (loading) return;
    if (!token || !user) return;

    const isAuthRoute = pathname?.startsWith("/auth");

    if (isAuthRoute) {
      router.replace(getDashboardPathForUser(user));
    }
  }, [loading, pathname, router, token, user]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!token && !!user,
      login,
      register,
      verifyRegisterOtp,
      sendForgotPasswordOtp,
      verifyForgotPasswordOtp,
      resetPassword,
      logout,
    }),
    [login, loading, logout, register, resetPassword, sendForgotPasswordOtp, token, user, verifyForgotPasswordOtp, verifyRegisterOtp]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}

// Convenience: role route map export (kept here only for debugging)
export const _DASHBOARD_ROUTE_MAP = DASHBOARD_ROUTE_MAP;
