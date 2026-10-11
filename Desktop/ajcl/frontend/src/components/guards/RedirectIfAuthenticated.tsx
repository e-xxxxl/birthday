import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/providers/AuthProvider";

/** Auth pages an already-signed-in user should skip. */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    const home = user.role === "admin" ? "/admin" : user.role === "rider" ? "/rider" : "/dashboard";
    return <Navigate to={home} replace />;
  }
  return <>{children}</>;
}
