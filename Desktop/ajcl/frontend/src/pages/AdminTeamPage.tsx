import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Alert, LoadingBlock, EmptyState } from "@/components/ui/Feedback";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http, HttpError } from "@/lib/http";
import { formatDateTime } from "@/lib/utils";
import type { AdminAccount } from "@/types";

const empty = { firstName: "", lastName: "", email: "", phone: "", password: "", superAdmin: false };

export function AdminTeamPage() {
  useDocumentTitle("Team");
  const { user } = useAuth();
  const toast = useToast();

  const { data, loading, error, reload } = useAsync(
    () => http.get<{ admins: AdminAccount[] }>("/api/admin/admins"),
    [],
  );

  const [form, setForm] = useState(empty);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AdminAccount | null>(null);

  if (user && !user.superAdmin) return <Navigate to="/admin" replace />;

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFormError(null);
    try {
      await http.post("/api/admin/admins", form);
      toast.success("Admin created", `${form.email} can now sign in at /admin/login.`);
      setForm(empty);
      reload();
    } catch (err) {
      setFormError(err instanceof HttpError ? err.message : "Could not create the admin.");
    } finally {
      setCreating(false);
    }
  }

  async function remove() {
    if (!removeTarget) return;
    try {
      await http.del(`/api/admin/admins/${removeTarget.id}`);
      toast.success("Admin removed");
      setRemoveTarget(null);
      reload();
    } catch (err) {
      toast.error("Could not remove", err instanceof HttpError ? err.message : "");
    }
  }

  const admins = data?.admins ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="mt-1 text-sm text-muted">
          Admin accounts that can sign in at <code>/admin/login</code>. Only super-admins see this
          page.
        </p>
      </div>

      <Card>
        <CardHeader title="Add an admin" />
        <CardBody>
          {formError ? (
            <Alert tone="danger" className="mb-4">
              {formError}
            </Alert>
          ) : null}
          <form onSubmit={create} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="First name" required value={form.firstName} onChange={set("firstName")} />
              <Input label="Last name" required value={form.lastName} onChange={set("lastName")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Email" type="email" required value={form.email} onChange={set("email")} />
              <Input label="Phone" type="tel" value={form.phone} onChange={set("phone")} />
            </div>
            <Input
              label="Temporary password"
              type="text"
              required
              value={form.password}
              onChange={set("password")}
              hint="At least 8 characters, with an uppercase letter and a number. Share it with the admin — they can reset it later."
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.superAdmin}
                onChange={(e) => setForm((f) => ({ ...f, superAdmin: e.target.checked }))}
                className="size-4 rounded border-line-strong accent-[var(--color-ink)]"
              />
              Make this a super-admin (can also add admins &amp; delete bookings)
            </label>
            <Button type="submit" loading={creating}>
              Create admin
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Admins" description={`${admins.length} account${admins.length === 1 ? "" : "s"}`} />
        <CardBody className="p-0">
          {loading && !data ? (
            <LoadingBlock />
          ) : error ? (
            <div className="p-5">
              <Alert tone="danger">
                {error}{" "}
                <button type="button" onClick={reload} className="font-semibold underline">
                  Retry
                </button>
              </Alert>
            </div>
          ) : admins.length === 0 ? (
            <EmptyState title="No admins yet" />
          ) : (
            <ul className="divide-y divide-line">
              {admins.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold">
                      {a.fullName}
                      {a.superAdmin ? (
                        <span className="ml-2 rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-accent-dark)]">
                          Super-admin
                        </span>
                      ) : null}
                      {a.id === user?.id ? (
                        <span className="ml-2 text-xs font-normal text-muted">(you)</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted">
                      {a.email}
                      {a.lastLoginAt ? ` · last in ${formatDateTime(a.lastLoginAt)}` : " · never signed in"}
                    </p>
                  </div>
                  {a.id !== user?.id ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--color-danger)]"
                      onClick={() => setRemoveTarget(a)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={remove}
        title={`Remove ${removeTarget?.fullName}?`}
        confirmLabel="Remove admin"
        message={
          <>
            <strong>{removeTarget?.email}</strong> will lose admin access immediately. Their bookings
            and history are not affected.
          </>
        }
      />
    </div>
  );
}
