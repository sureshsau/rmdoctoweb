"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/state/AuthContext";
import { getDashboardPathForUser } from "@/lib/roleRoutes";

const PUBLIC_PREFIXES = [
  "/auth", // login/register/otp/forgot/reset
  "/medicine-store", // Allow all store sub-routes (cart, details)
];

const PUBLIC_PATHS = new Set<string>([
  "/",
  "/about",
  "/services",
  // "/medicine-store", // Moved to prefix
  "/lab-test",
  "/contact",
]);

function isPublicRoute(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function roleFromPath(pathname: string) {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/doctor")) return "doctor";
  if (pathname.startsWith("/agent")) return "agent";
  if (pathname.startsWith("/reception")) return "reception";
  if (pathname.startsWith("/dashboard")) return "user";
  if (pathname.startsWith("/ChekInOut")) return "staff";
  return null;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated, user } = useAuthContext();
  const pathname = usePathname() || "/";
  const router = useRouter();

  const publicRoute = useMemo(() => isPublicRoute(pathname), [pathname]);

  useEffect(() => {
    if (loading) return;

    // Not authenticated -> block protected routes
    if (!isAuthenticated && !publicRoute) {
      router.replace("/auth/login");
      return;
    }

    // Authenticated -> auth routes redirect to dashboard (but allow landing page)
    if (isAuthenticated && pathname.startsWith("/auth")) {
      router.replace(getDashboardPathForUser(user));
      return;
    }

    // Role-based route enforcement
    if (isAuthenticated && !publicRoute) {
      const expected = (user?.dashboard || "user").toString();
      const routeRole = roleFromPath(pathname);

      // Staff-only page (CheckInOut) should be blocked for plain users
      if (routeRole === "staff") {
        const allowed = new Set(["admin", "doctor", "receptionist", "reception", "agent"]);
        if (!allowed.has(expected)) {
          router.replace("/unauthorized");
        }
        return;
      }

      // If trying to open a dashboard not matching their dashboard, redirect.
      if (routeRole && routeRole !== expected && !(routeRole === "reception" && expected === "receptionist")) {
        // If they are a normal user, allow /dashboard.
        router.replace(getDashboardPathForUser(user));
      }
    }
  }, [isAuthenticated, loading, pathname, publicRoute, router, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-cyan-50 via-blue-50 to-white text-gray-700 font-semibold">
        Checking session…
      </div>
    );
  }

  return <>{children}</>;
}
