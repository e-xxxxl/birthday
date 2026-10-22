import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/providers/AuthProvider";
import { homeFor } from "@/lib/roles";

/** Auth pages an already-signed-in user should skip. */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return <Navigate to={homeFor(user.role)} replace />;
  }
  return <>{children}</>;
}
