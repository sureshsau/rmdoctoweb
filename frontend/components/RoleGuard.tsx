"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type UserRole = "admin" | "subadmin" | "doctor" | "receptionist" | "agent" | "marketing_agent" | "employee" | "user";

type RoleGuardProps = {
  allowed: UserRole[];
  children: ReactNode;
};

export default function RoleGuard({ allowed, children }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    const dashboard = (user?.dashboard || "user") as UserRole;

    if (!loading && user && !allowed.includes(dashboard)) {
      router.push("/unauthorized");
    }
  }, [user, loading, allowed, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking authentication...
      </div>
    );
  }

  return <>{children}</>;
}
