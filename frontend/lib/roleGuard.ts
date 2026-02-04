import { getValidToken } from "@/lib/auth";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function requireRole(
  router: AppRouterInstance,
  allowedRoles: Array<
    "admin" | "doctor" | "receptionist" | "agent" | "user"
  >
) {
  const token = getValidToken();
  const rawUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = rawUser ? (JSON.parse(rawUser) as { dashboard?: string }) : null;

  if (!token || !user) {
    router.push("/auth/login");
    return false;
  }

  const dashboard = (user.dashboard || "user").toString() as
    | "admin"
    | "doctor"
    | "receptionist"
    | "agent"
    | "user";
  if (!allowedRoles.includes(dashboard)) {
    router.push("/unauthorized");
    return false;
  }

  return true;
}
