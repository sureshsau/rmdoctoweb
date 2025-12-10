'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requireRole } from "@/lib/roleGuard";

export default function CheckInPage({
  children,
}:{
    children:React.ReactNode
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const ok = requireRole(router, [
      "doctor",
      "receptionist",
      "agent",
    ]);

    if (ok) setAllowed(true);
  }, [router]);

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center font-semibold">
        Verifying access...
      </div>
    );
  }

  return (
    <div>
      {children}
    </div>
  );
}
