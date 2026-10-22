import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Alert } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/providers/AuthProvider";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http, HttpError } from "@/lib/http";
import type { SessionUser } from "@/types";

export function RiderProfilePage() {
  useDocumentTitle("Profile");
  const { user, refresh } = useAuth();
  const toast = useToast();

  const [phone, setPhone] = useState(user?.phone ?? "");
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!user) return null;

  async function savePhone(e: React.FormEvent) {
    e.preventDefault();
    setSavingPhone(true);
    setPhoneError(null);
    try {
      await http.patch<{ user: SessionUser }>("/api/rider/me", { phone });
      toast.success("Phone number updated");
      await refresh();
    } catch (err) {
      setPhoneError(err instanceof HttpError ? err.message : "Could not update your phone number.");
    } finally {
      setSavingPhone(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      await http.patch("/api/rider/me", { currentPassword, password: newPassword });
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof HttpError ? err.message : "Could not update your password.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">Profile</h1>
        <p className="mt-1 text-sm text-muted">Your rider account details.</p>
      </div>

      <Card>
        <CardHeader title="Account" />
        <CardBody className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="rule-label">Name</p>
            <p className="mt-0.5 font-semibold">{user.fullName}</p>
          </div>
          <div>
            <p className="rule-label">Email</p>
            <p className="mt-0.5 font-semibold">{user.email}</p>
          </div>
          <div>
            <p className="rule-label">Vehicle</p>
            <p className="mt-0.5 font-semibold">{user.rider?.vehicleType || "—"}</p>
          </div>
          <div>
            <p className="rule-label">Plate number</p>
            <p className="mt-0.5 font-mono font-semibold tracking-wide">{user.rider?.plate || "—"}</p>
          </div>
        </CardBody>
        <p className="border-t border-line px-5 py-3 text-xs text-muted">
          Name, vehicle and plate number are set by your admin. Contact them to update these.
        </p>
      </Card>

      <Card>
        <CardHeader title="Phone number" description="Shown to senders and receivers you're delivering for." />
        <CardBody>
          <form onSubmit={savePhone} className="space-y-3">
            {phoneError ? <Alert tone="danger">{phoneError}</Alert> : null}
            <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Button size="sm" loading={savingPhone}>
              Save phone number
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Change password" />
        <CardBody>
          <form onSubmit={savePassword} className="space-y-3">
            {passwordError ? <Alert tone="danger">{passwordError}</Alert> : null}
            <PasswordInput
              label="Current password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <PasswordInput
              label="New password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              hint="At least 8 characters, with an uppercase letter and a number."
            />
            <PasswordInput
              label="Confirm new password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button size="sm" loading={savingPassword}>
              Update password
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
