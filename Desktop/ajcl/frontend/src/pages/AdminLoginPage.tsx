import { Navigate } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { isStaff, homeFor } from "@/lib/roles";

export function AdminLoginPage() {
  useDocumentTitle("Admin sign in");
  const { user, loading } = useAuth();

  if (!loading && user && isStaff(user.role)) return <Navigate to={homeFor(user.role)} replace />;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo href={null} variant="light" />
        </div>
        <div className="rounded-sm bg-paper p-6 shadow-pop sm:p-8">
          <h1 className="text-xl font-bold">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted">Restricted area. Staff accounts only.</p>
          <div className="mt-6">
            <AdminLoginForm />
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-paper/50">
          Not staff?{" "}
          <a href="/login" className="underline hover:text-paper">
            Customer login
          </a>
        </p>
      </div>
    </div>
  );
}
