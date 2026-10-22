import { AppLink as Link } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert, LoadingBlock } from "@/components/ui/Feedback";
import { ShipmentStatusBadge } from "@/components/shipping/ShipmentBits";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http } from "@/lib/http";
import { formatDate } from "@/lib/utils";
import { regionName as countryName } from "@/lib/utils";
import type { Shipment } from "@/types/shipping";

export function DashboardShipmentsPage() {
  useDocumentTitle("My shipments");
  const { data, loading, error } = useAsync(() => http.get<{ shipments: Shipment[] }>("/api/shipments"), []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold sm:text-4xl">My shipments</h1>
        <Button href="/send" size="sm" variant="accent">
          New booking
        </Button>
      </div>
      <p className="text-sm text-muted">Interstate and international shipments. Local deliveries are under My bookings.</p>

      {loading ? <LoadingBlock /> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {data && data.shipments.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <p className="font-semibold">No shipments yet</p>
            <p className="mt-1 text-sm text-muted">Send a package to another state or abroad.</p>
            <Button href="/send/interstate" className="mt-5">
              Ship a package
            </Button>
          </CardBody>
        </Card>
      ) : null}

      <div className="grid gap-3">
        {data?.shipments.map((s) => (
          <Link
            key={s.id}
            href={`/dashboard/shipments/${s.reference}`}
            className="flex flex-col gap-2 rounded-2xl border border-line bg-paper shadow-card p-4 transition hover:border-ink sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-mono font-bold">{s.reference}</p>
              <p className="truncate text-sm text-muted">
                To {s.receiver.name}, {s.receiver.city}, {countryName(s.receiver.country)}
              </p>
              <p className="text-xs text-muted">
                {s.shipmentType === "international" ? "International" : "Interstate"}
                {s.createdAt ? ` · ${formatDate(s.createdAt)}` : ""}
              </p>
            </div>
            <ShipmentStatusBadge status={s.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
