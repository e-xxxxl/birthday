
import { useState } from "react";
import { AppLink as Link } from "@/components/ui/AppLink";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { formErrorsFrom } from "@/components/auth/AuthCard";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { http, HttpError } from "@/lib/http";

export function ResetPasswordForm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const token = params.get("token") ?? "";

  const [values, setValues] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <Alert tone="danger">
        This reset link is missing its token.{" "}
        <Link href="/forgot-password" className="font-semibold underline">
          Request a new one
        </Link>
        .
      </Alert>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    const parsed = resetPasswordSchema.safeParse({ ...values, token });
    if (!parsed.success) {
      setErrors(formErrorsFrom(parsed.error.flatten().fieldErrors as Record<string, string[]>));
      return;
    }

    setLoading(true);
    try {
      await http.post("/api/auth/reset-password", parsed.data);
      toast.success("Password updated", "You can now log in with your new password.");
      navigate("/login");
    } catch (err) {
      if (err instanceof HttpError) {
        setFormError(err.message);
        setErrors(formErrorsFrom(err.details));
      } else {
        setFormError("Something went wrong. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError ? <Alert tone="danger">{formError}</Alert> : null}
      <PasswordInput
        label="New password"
        required
        autoComplete="new-password"
        value={values.password}
        onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
        error={errors.password}
        hint="At least 8 characters, with an uppercase letter and a number."
      />
      <PasswordInput
        label="Confirm new password"
        required
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={(e) => setValues((v) => ({ ...v, confirmPassword: e.target.value }))}
        error={errors.confirmPassword}
      />
      <Button type="submit" fullWidth loading={loading}>
        Reset password
      </Button>
    </form>
  );
}
