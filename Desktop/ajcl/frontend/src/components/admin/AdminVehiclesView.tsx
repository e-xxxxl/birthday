
import { useState } from "react";
import { VehicleIcon } from "@/components/ui/VehicleIcon";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { http, HttpError } from "@/lib/http";
import { formatNaira } from "@/lib/utils";
import type { VehicleDTO } from "@/types";
import type { AdminVehicle } from "@/types/admin";

type Draft = {
  name: string;
  description: string;
  capacity: string;
  image: string;
  pricePerKm: number;
  basePrice: number;
  minimumFare: number;
  averageSpeedKmh: number;
  fleetSize: number;
  sortOrder: number;
  active: boolean;
};

const toDraft = (v?: VehicleDTO): Draft => ({
  name: v?.name ?? "",
  description: v?.description ?? "",
  capacity: v?.capacity ?? "",
  image: v?.image ?? "",
  pricePerKm: v?.pricePerKm ?? 0,
  basePrice: v?.basePrice ?? 0,
  minimumFare: v?.minimumFare ?? 0,
  averageSpeedKmh: v?.averageSpeedKmh ?? 24,
  fleetSize: v?.fleetSize ?? 0,
  sortOrder: v?.sortOrder ?? 0,
  active: v?.active ?? true,
});

export function AdminVehiclesView({ initialVehicles }: { initialVehicles: AdminVehicle[] }) {
  const toast = useToast();
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [editing, setEditing] = useState<AdminVehicle | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminVehicle | null>(null);
  const [draft, setDraft] = useState<Draft>(toDraft());

  /** Keep the live fleet-usage count when merging a save/patch response. */
  const withUsage = (v: VehicleDTO, prev?: AdminVehicle): AdminVehicle => ({
    ...v,
    unitsInUse: (v as AdminVehicle).unitsInUse ?? prev?.unitsInUse ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noRates = vehicles.length > 0 && vehicles.every((v) => v.pricePerKm === 0);

  function openCreate() {
    setDraft(toDraft());
    setError(null);
    setCreating(true);
  }
  function openEdit(v: AdminVehicle) {
    setDraft(toDraft(v));
    setError(null);
    setEditing(v);
  }
  function close() {
    setEditing(null);
    setCreating(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      if (creating) {
        const { vehicle } = await http.post<{ vehicle: VehicleDTO }>("/api/admin/vehicles", draft);
        setVehicles((prev) =>
          [...prev, withUsage(vehicle)].sort((a, b) => a.sortOrder - b.sortOrder),
        );
        toast.success("Vehicle added");
      } else if (editing) {
        const { vehicle } = await http.patch<{ vehicle: VehicleDTO }>(
          `/api/admin/vehicles/${editing.id}`,
          draft,
        );
        setVehicles((prev) =>
          prev
            .map((v) => (v.id === vehicle.id ? withUsage(vehicle, v) : v))
            .sort((a, b) => a.sortOrder - b.sortOrder),
        );
        toast.success("Vehicle updated");
      }
      close();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Could not save the vehicle.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(v: AdminVehicle) {
    try {
      const { vehicle } = await http.patch<{ vehicle: VehicleDTO }>(`/api/admin/vehicles/${v.id}`, {
        active: !v.active,
      });
      setVehicles((prev) => prev.map((x) => (x.id === vehicle.id ? withUsage(vehicle, x) : x)));
    } catch (err) {
      toast.error("Could not update", err instanceof HttpError ? err.message : "");
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    try {
      const res = await http.del<{ deleted?: boolean; deactivated?: boolean }>(
        `/api/admin/vehicles/${deleteTarget.id}`,
      );
      if (res.deleted) {
        setVehicles((prev) => prev.filter((v) => v.id !== deleteTarget.id));
        toast.success("Vehicle deleted");
      } else {
        setVehicles((prev) =>
          prev.map((v) => (v.id === deleteTarget.id ? { ...v, active: false } : v)),
        );
        toast.info("Vehicle deactivated", "It has bookings, so it was hidden instead of deleted.");
      }
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Could not delete", err instanceof HttpError ? err.message : "");
    }
  }

  const numField = (key: keyof Draft, label: string, hint?: string) => (
    <Input
      label={label}
      type="number"
      min={0}
      value={String(draft[key] ?? 0)}
      onChange={(e) => setDraft((d) => ({ ...d, [key]: Math.max(0, Number(e.target.value) || 0) }))}
      hint={hint}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Vehicles &amp; pricing</h1>
          <p className="mt-1 text-sm text-muted">
            Set the rate and fleet size for each class. A class stops accepting bookings once every
            unit is out on a delivery. Changes apply immediately.
          </p>
        </div>
        <Button onClick={openCreate}>Add vehicle</Button>
      </div>

      {noRates ? (
        <Alert tone="warning" title="No rates configured">
          Every vehicle has a ₦0/km rate, so booking totals will be ₦0. Set real rates below to enable
          checkout.
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((v) => (
          <Card key={v.id} className={v.active ? "" : "opacity-60"}>
            <CardBody className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-sm bg-surface">
                    <VehicleIcon slug={v.slug} className="size-6" />
                  </span>
                  <div>
                    <p className="font-bold">{v.name}</p>
                    <p className="text-xs text-muted">{v.capacity || "—"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleActive(v)}
                  className="text-xs font-semibold text-ink-soft hover:text-ink"
                >
                  {v.active ? "Active" : "Inactive"}
                </button>
              </div>

              <dl className="grid grid-cols-3 gap-2 rounded-sm bg-surface p-3 text-center text-xs">
                <div>
                  <dt className="text-muted">Per km</dt>
                  <dd className="mt-0.5 font-bold">{formatNaira(v.pricePerKm)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Base</dt>
                  <dd className="mt-0.5 font-bold">{formatNaira(v.basePrice)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Min fare</dt>
                  <dd className="mt-0.5 font-bold">{formatNaira(v.minimumFare)}</dd>
                </div>
              </dl>

              <div className="flex items-center justify-between rounded-sm bg-surface p-3 text-xs">
                <span className="font-semibold text-muted">Fleet</span>
                {v.fleetSize > 0 ? (
                  <span
                    className={
                      "font-bold " +
                      ((v.unitsInUse ?? 0) >= v.fleetSize
                        ? "text-[var(--color-danger)]"
                        : "text-ink")
                    }
                  >
                    {(v.unitsInUse ?? 0)} / {v.fleetSize} in use
                    {(v.unitsInUse ?? 0) >= v.fleetSize ? " · fully booked" : ""}
                  </span>
                ) : (
                  <span className="font-bold text-ink-soft">Unlimited</span>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" fullWidth onClick={() => openEdit(v)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(v)}
                  className="text-[var(--color-danger)]"
                >
                  Delete
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal
        open={creating || Boolean(editing)}
        onClose={close}
        title={creating ? "Add vehicle" : `Edit ${editing?.name}`}
        size="lg"
      >
        <div className="space-y-4">
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <Input
            label="Name"
            required
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <Textarea
            label="Description"
            required
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Capacity label"
              value={draft.capacity}
              onChange={(e) => setDraft((d) => ({ ...d, capacity: e.target.value }))}
            />
            <Input
              label="Image URL"
              value={draft.image}
              onChange={(e) => setDraft((d) => ({ ...d, image: e.target.value }))}
              hint="Optional"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {numField("pricePerKm", "Price per km (₦)")}
            {numField("basePrice", "Base fare (₦)")}
            {numField("minimumFare", "Minimum fare (₦)")}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {numField("fleetSize", "Fleet size", "Units you run. 0 = unlimited")}
            {numField("averageSpeedKmh", "Avg speed (km/h)", "Used for ETA fallback")}
            {numField("sortOrder", "Sort order")}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
              className="size-4 rounded border-line-strong accent-[var(--color-ink)]"
            />
            Active (available for booking)
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={close} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {creating ? "Add vehicle" : "Save changes"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title={`Delete ${deleteTarget?.name}?`}
        confirmLabel="Delete"
        message="If this vehicle has existing bookings it will be deactivated instead of deleted."
      />
    </div>
  );
}
