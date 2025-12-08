import { jwtDecode } from "jwt-decode";

export type DecodedUser = {
  id: string;
  role: "admin" | "doctor" | "receptionist" | "agent" | "user";
  exp: number;
};

export const getUserFromToken = (): DecodedUser | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded: DecodedUser = jwtDecode(token);

    // ✅ Auto logout on expiry
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.clear();
      return null;
    }

    return decoded;
  } catch {
    localStorage.clear();
    return null;
  }
};
