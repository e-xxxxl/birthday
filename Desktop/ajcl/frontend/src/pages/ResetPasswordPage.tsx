import { AppLink as Link } from "@/components/ui/AppLink";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function ResetPasswordPage() {
  useDocumentTitle("Set a new password");
  return (
    <AuthCard
      title="Set a new password"
      subtitle="Choose a strong password you don't use elsewhere."
      footer={
        <Link href="/login" className="font-semibold text-ink hover:underline">
          Back to log in
        </Link>
      }
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
