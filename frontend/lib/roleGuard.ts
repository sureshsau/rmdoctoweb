import { getUserFromToken } from "@/lib/auth";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function requireRole(
  router: AppRouterInstance,
  allowedRoles: Array<
    "admin" | "doctor" | "receptionist" | "agent" | "user"
  >
) {
  const user = getUserFromToken();

  if (!user) {
    router.push("/auth/login");
    return false;
  }

  if (!allowedRoles.includes(user.role)) {
    router.push("/unauthorized");
    return false;
  }

  return true;
}
