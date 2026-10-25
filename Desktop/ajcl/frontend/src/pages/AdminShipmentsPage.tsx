import { useState } from "react";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert, LoadingBlock } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { ShipmentStatusBadge } from "@/components/shipping/ShipmentBits";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http } from "@/lib/http";
import { cn, formatDate } from "@/lib/utils";
import { regionName as countryName } from "@/lib/utils";
import { SHIPMENT_STATUS_META, type ShipmentStatus } from "@/config/shipping";
import type { Shipment } from "@/types/shipping";

type Filter = "todo" | "all" | ShipmentStatus;

const TODO: ShipmentStatus[] = ["awaiting_dropoff", "awaiting_pickup", "in_transit_to_office", "received_at_office", "weight_confirmed", "paid", "booking_failed"];

export function AdminShipmentsPage() {
  useDocumentTitle("Shipments desk");
  const [filter, setFilter] = useState<Filter>("todo");
  const [q, setQ] = useState("");
  const { data, loading, error } = useAsync(
    () =>
      http.get<{ shipments: Shipment[]; counts: Record<string, number> }>(
        `/api/office/shipments?limit=200${q ? `&q=${encodeURIComponent(q)}` : ""}`,
      ),
    [q],
  );

  const counts = data?.counts ?? {};
  const todoCount = TODO.reduce((n, s) => n + (counts[s] ?? 0), 0);
  const list = (data?.shipments ?? []).filter((s) =>
    filter === "all" ? true : filter === "todo" ? TODO.includes(s.status) : s.status === filter,
  );

  const chips: { key: Filter; label: string; n?: number }[] = [
    { key: "todo", label: "Needs action", n: todoCount },
    { key: "paid", label: "Paid, waiting to be booked", n: counts.paid ?? 0 },
    { key: "all", label: "All" },
    ...(["quote_sent", "booked", "in_transit", "delivered", "cancelled"] as ShipmentStatus[]).map((s) => ({
      key: s as Filter,
      label: SHIPMENT_STATUS_META[s].label,
      n: counts[s] ?? 0,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Shipments desk</h1>
          <p className="text-sm text-muted">Interstate and international shipments.</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <Input
            aria-label="Search shipments"
            placeholder="Search reference, name or tracking"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            containerClassName="w-full sm:w-72"
          />
          <Button href="/admin/shipments/new" size="sm">
            New shipment
          </Button>
        </div>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFilter(c.key)}
            className={cn(
              "shrink-0 rounded-sm border px-3.5 py-1.5 text-sm font-semibold transition",
              filter === c.key ? "border-ink bg-ink text-paper" : "border-line-strong bg-paper text-ink-soft hover:border-ink",
            )}
          >
            {c.label}
            {c.n !== undefined ? <span className="ml-1.5 opacity-70">{c.n}</span> : null}
          </button>
        ))}
      </div>

      {loading && !data ? <LoadingBlock /> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {data && list.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center text-sm text-muted">Nothing here right now.</CardBody>
        </Card>
      ) : null}

      <div className="grid gap-3">
        {list.map((s) => (
          <Link
            key={s.id}
            href={`/admin/shipments/${s.reference}`}
            className="flex flex-col gap-2 rounded-2xl border border-line bg-paper shadow-card p-4 transition hover:border-ink sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-bold">
                {s.reference}{" "}
                <span className="ml-1 rule-label">
                  {s.shipmentType === "international" ? "International" : "Interstate"} · {s.handover.method === "pickup" ? "Rider pickup" : "Drop-off"}
                </span>
              </p>
              <p className="truncate text-sm text-muted">
                {s.customer?.name} · to {s.receiver.city}, {countryName(s.receiver.country)}
              </p>
              <p className="text-xs text-muted">{s.createdAt ? formatDate(s.createdAt) : ""}</p>
            </div>
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <ShipmentStatusBadge status={s.status} />
              {s.status === "paid" && !s.terminal.trackingNumber ? <span className="text-xs font-semibold text-[var(--color-warning)]">Waiting to be booked on Terminal</span> : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
