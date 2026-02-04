import { useAuthContext } from "@/state/AuthContext";

export const useAuth = () => {
  const { user, loading, isAuthenticated } = useAuthContext();
  return { user, loading, isAuthenticated };
};
