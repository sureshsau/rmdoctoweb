import { jwtDecode } from "jwt-decode";

export type DecodedToken = {
  id?: string;
  exp: number;
  deviceType?: "web" | "app";
  version?: number;
};

export function getValidToken(): string | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode<DecodedToken>(token);

    // Auto logout on expiry
    if (!decoded?.exp || decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }

    return token;
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return null;
  }
}

export function getDecodedToken(): DecodedToken | null {
  const token = getValidToken();
  if (!token) return null;
  try {
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
}
