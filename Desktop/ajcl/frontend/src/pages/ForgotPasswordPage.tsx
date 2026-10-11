import { AppLink as Link } from "@/components/ui/AppLink";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { RedirectIfAuthenticated } from "@/components/guards/RedirectIfAuthenticated";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function ForgotPasswordPage() {
  useDocumentTitle("Reset password");
  return (
    <RedirectIfAuthenticated>
      <AuthCard
        title="Forgot your password?"
        subtitle="Enter your email and we'll send you a link to reset it."
        footer={
          <Link href="/login" className="font-semibold text-ink hover:underline">
            Back to log in
          </Link>
        }
      >
        <ForgotPasswordForm />
      </AuthCard>
    </RedirectIfAuthenticated>
  );
}
