import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Alert, LoadingBlock, EmptyState } from "@/components/ui/Feedback";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http, HttpError } from "@/lib/http";
import { formatDateTime } from "@/lib/utils";
import type { RiderAccount, VehicleDTO } from "@/types";

const empty = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  plate: "",
  vehicleType: "",
  maxActiveJobs: "",
  password: "",
};

export function AdminRidersPage() {
  useDocumentTitle("Riders");
  const toast = useToast();

  const { data, loading, error, reload } = useAsync(
    () => http.get<{ riders: RiderAccount[] }>("/api/admin/riders"),
    [],
  );

  const { data: vehiclesData } = useAsync(
    () => http.get<{ vehicles: VehicleDTO[] }>("/api/admin/vehicles"),
    [],
  );
  const vehicleNames = (vehiclesData?.vehicles ?? []).filter((v) => v.active).map((v) => v.name);

  const [form, setForm] = useState(empty);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<RiderAccount | null>(null);
  const [editTarget, setEditTarget] = useState<RiderAccount | null>(null);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFormError(null);
    try {
      await http.post("/api/admin/riders", {
        ...form,
        maxActiveJobs: form.maxActiveJobs.trim() ? Number(form.maxActiveJobs) : undefined,
      });
      toast.success("Rider created", `${form.email} can now sign in at /rider/login.`);
      setForm(empty);
      reload();
    } catch (err) {
      setFormError(err instanceof HttpError ? err.message : "Could not create the rider.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(rider: RiderAccount) {
    try {
      await http.patch(`/api/admin/riders/${rider.id}`, { active: !rider.active });
      toast.success(rider.active ? "Rider deactivated" : "Rider activated");
      reload();
    } catch (err) {
      toast.error("Could not update", err instanceof HttpError ? err.message : "");
    }
  }

  async function remove() {
    if (!removeTarget) return;
    try {
      await http.del(`/api/admin/riders/${removeTarget.id}`);
      toast.success("Rider removed");
      setRemoveTarget(null);
      reload();
    } catch (err) {
      toast.error("Could not remove", err instanceof HttpError ? err.message : "");
    }
  }

  const riders = data?.riders ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Riders</h1>
        <p className="mt-1 text-sm text-muted">
          Rider accounts that can sign in at <code>/rider/login</code>, see their assigned deliveries,
          and confirm pickup/delivery with handover codes.
        </p>
      </div>

      <Card>
        <CardHeader title="Add a rider" />
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
              <Input label="Phone" type="tel" required value={form.phone} onChange={set("phone")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Plate number"
                value={form.plate}
                onChange={set("plate")}
                placeholder="e.g. LAG-123-XY"
              />
              <VehicleSelect
                value={form.vehicleType}
                onChange={(v) => setForm((f) => ({ ...f, vehicleType: v }))}
                options={vehicleNames}
              />
            </div>
            <MaxOrdersInput
              value={form.maxActiveJobs}
              onChange={(v) => setForm((f) => ({ ...f, maxActiveJobs: v }))}
            />
            <Input
              label="Temporary password"
              type="text"
              autoComplete="off"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              hint="Shown in plain text so you can read it out to the rider. At least 8 characters, with an uppercase letter and a number. They can change it after signing in."
            />
            <Button type="submit" loading={creating}>
              Create rider
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Riders" description={`${riders.length} account${riders.length === 1 ? "" : "s"}`} />
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
          ) : riders.length === 0 ? (
            <EmptyState title="No riders yet" description="Add your first rider above." />
          ) : (
            <ul className="divide-y divide-line">
              {riders.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {r.fullName}
                      {r.active ? null : (
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                          Deactivated
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {r.email} · {r.phone}
                      {r.plate ? ` · ${r.plate}` : ""}
                      {r.vehicleType ? ` · ${r.vehicleType}` : ""}
                    </p>
                    <p className="text-xs text-muted">
                      <span className={r.activeJobs >= r.maxActiveJobs ? "font-semibold text-[var(--color-warning)]" : ""}>
                        {r.activeJobs}/{r.maxActiveJobs} active
                      </span>{" "}
                      · {r.completedJobs} completed
                      {r.lastLoginAt ? ` · last in ${formatDateTime(r.lastLoginAt)}` : " · never signed in"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditTarget(r)}>
                      Edit
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => toggleActive(r)}>
                      {r.active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--color-danger)]"
                      onClick={() => setRemoveTarget(r)}
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <EditRiderModal
        key={editTarget?.id ?? "none"}
        rider={editTarget}
        vehicleNames={vehicleNames}
        onClose={() => setEditTarget(null)}
        onSaved={reload}
      />

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={remove}
        title={`Remove ${removeTarget?.fullName}?`}
        confirmLabel="Remove rider"
        message={
          <>
            <strong>{removeTarget?.email}</strong> will lose access immediately. Blocked while they have
            active deliveries.
          </>
        }
      />
    </div>
  );
}

function EditRiderModal({
  rider,
  vehicleNames,
  onClose,
  onSaved,
}: {
  rider: RiderAccount | null;
  vehicleNames: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [phone, setPhone] = useState(rider?.phone ?? "");
  const [plate, setPlate] = useState(rider?.plate ?? "");
  const [vehicleType, setVehicleType] = useState(rider?.vehicleType ?? "");
  const [maxActive, setMaxActive] = useState(rider ? String(rider.maxActiveJobs) : "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!rider) return;
    setSaving(true);
    setError(null);
    try {
      const patch: Record<string, unknown> = {
        phone,
        plate,
        vehicleType,
        maxActiveJobs: maxActive.trim() ? Number(maxActive) : null,
      };
      if (password) patch.password = password;
      await http.patch(`/api/admin/riders/${rider.id}`, patch);
      toast.success("Rider updated");
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={Boolean(rider)} onClose={onClose} title={rider ? `Edit ${rider.fullName}` : ""}>
      <div className="space-y-3">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Plate number" value={plate} onChange={(e) => setPlate(e.target.value)} />
          <VehicleSelect value={vehicleType} onChange={setVehicleType} options={vehicleNames} />
        </div>
        <MaxOrdersInput value={maxActive} onChange={setMaxActive} />
        <Input
          label="Set a new password (optional)"
          type="text"
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Shown in plain text so you can share it. Leave blank to keep their current password."
        />
        <Button fullWidth loading={saving} onClick={save}>
          Save changes
        </Button>
      </div>
    </Modal>
  );
}

/** Which vehicle class a rider drives. Automatic allocation only gives a rider
 *  bookings for the vehicle they're set to ("Any vehicle" takes every kind). */
function VehicleSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  // Keep an older free-text value selectable so editing a rider never loses it.
  const all = value && !options.includes(value) ? [...options, value] : options;
  return (
    <Select
      label="Vehicle they ride"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      hint="Automatic allocation only gives a rider bookings for this vehicle."
    >
      <option value="">Any vehicle</option>
      {all.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </Select>
  );
}

/** How many active orders a rider may hold at once. Auto-assignment and "accept order" stop at this. */
function MaxOrdersInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Input
      label="Max active orders"
      type="number"
      inputMode="numeric"
      min={1}
      max={50}
      placeholder="Default (3)"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
      hint="The most orders this rider can hold at once. Once they reach it they get no new orders until they finish one. Leave blank for the default."
    />
  );
}
