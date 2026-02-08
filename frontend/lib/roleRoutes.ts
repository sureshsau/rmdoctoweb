export const DASHBOARD_ROUTE_MAP: Record<string, string> = {
  admin: "/admin/dashboard",
  doctor: "/doctor/dashboard",
  receptionist: "/receptionist/dashboard",
  agent: "/agent/dashboard",
  marketing_agent: "/marketing-agent/dashboard",
  user: "/dashboard",
};

// Back-compat export name (older code imported ROLE_DASHBOARD_MAP)
export const ROLE_DASHBOARD_MAP = DASHBOARD_ROUTE_MAP;

export function getDashboardPathForUser(user: { dashboard?: string } | null | undefined) {
  const key = (user?.dashboard || "user").toString();
  return DASHBOARD_ROUTE_MAP[key] || "/dashboard";
}
