
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { Input } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { formErrorsFrom } from "@/components/auth/AuthCard";
import { signupSchema } from "@/lib/validation/auth";
import { HttpError } from "@/lib/http";

const empty = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export function SignupForm() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toast = useToast();
  const next = params.get("next") || "/book";

  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    const parsed = signupSchema.safeParse(values);
    if (!parsed.success || !agreed) {
      const found = parsed.success ? {} : formErrorsFrom(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      setErrors({ ...found, ...(agreed ? {} : { agreed: "You need to accept the Terms and Privacy Policy to create an account" }) });
      return;
    }

    setLoading(true);
    try {
      const user = await signup(parsed.data);
      toast.success("Account created", `Welcome, ${user.firstName}!`);
      navigate(next);
    } catch (err) {
      if (err instanceof HttpError) {
        setFormError(err.message);
        setErrors(formErrorsFrom(err.details));
      } else {
        setFormError("Could not create your account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError ? <Alert tone="danger">{formError}</Alert> : null}

      <div className="grid grid-cols-2 gap-3">
        <Input label="First name" required value={values.firstName} onChange={set("firstName")} error={errors.firstName} autoComplete="given-name" />
        <Input label="Last name" required value={values.lastName} onChange={set("lastName")} error={errors.lastName} autoComplete="family-name" />
      </div>
      <Input label="Email" type="email" required value={values.email} onChange={set("email")} error={errors.email} autoComplete="email" />
      <Input
        label="Phone number"
        type="tel"
        required
        value={values.phone}
        onChange={set("phone")}
        error={errors.phone}
        placeholder="+234 802 123 4567"
        autoComplete="tel"
      />
      <PasswordInput
        label="Password"
        required
        value={values.password}
        onChange={set("password")}
        error={errors.password}
        hint="At least 8 characters, with an uppercase letter and a number."
        autoComplete="new-password"
      />
      <PasswordInput
        label="Confirm password"
        required
        value={values.confirmPassword}
        onChange={set("confirmPassword")}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />

      <div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            required
            className="mt-1 size-4 shrink-0"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              if (e.target.checked) setErrors((x) => ({ ...x, agreed: "" }));
            }}
            aria-invalid={Boolean(errors.agreed)}
          />
          <span>
            I agree to the{" "}
            <a href="/terms" target="_blank" rel="noreferrer" className="font-semibold underline hover:text-accent-dark">
              Terms
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" rel="noreferrer" className="font-semibold underline hover:text-accent-dark">
              Privacy Policy
            </a>
            <span className="ml-0.5 text-[var(--color-danger)]">*</span>
          </span>
        </label>
        {errors.agreed ? <p className="mt-1 text-xs font-medium text-[var(--color-danger)]">{errors.agreed}</p> : null}
      </div>

      <Button type="submit" fullWidth loading={loading} disabled={!agreed}>
        Create account
      </Button>
    </form>
  );
}
