import { useEffect, useState } from "react";
import { getUserFromToken, DecodedUser } from "@/lib/auth";

export const useAuth = () => {
  const [user, setUser] = useState<DecodedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const decoded = getUserFromToken();
    setUser(decoded);
    setLoading(false);
  }, []);

  return { user, loading, isAuthenticated: !!user };
};
