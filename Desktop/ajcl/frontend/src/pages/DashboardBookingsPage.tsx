import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { EmptyState, LoadingBlock, Alert } from "@/components/ui/Feedback";
import { BookingCard } from "@/components/dashboard/BookingCard";
import { BookingsFilter } from "@/components/dashboard/BookingsFilter";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http } from "@/lib/http";
import type { BookingDTO } from "@/types";

export function DashboardBookingsPage() {
  useDocumentTitle("My bookings");
  const [params] = useSearchParams();
  const statusFilter = params.get("status") || "all";

  const { data, loading, error, reload } = useAsync(
    () => http.get<{ bookings: BookingDTO[] }>("/api/bookings"),
    [],
  );

  const bookings = data?.bookings ?? [];
  const filtered =
    statusFilter === "all" ? bookings : bookings.filter((b) => b.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My bookings</h1>
          <p className="mt-1 text-sm text-muted">{bookings.length} total</p>
        </div>
        <Button href="/book">New booking</Button>
      </div>

      {error ? (
        <Alert tone="danger">
          {error}{" "}
          <button type="button" onClick={reload} className="font-semibold underline">
            Retry
          </button>
        </Alert>
      ) : null}

      <BookingsFilter current={statusFilter} />

      {loading && bookings.length === 0 ? (
        <LoadingBlock />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📦"
          title={bookings.length === 0 ? "No bookings yet" : "Nothing matches this filter"}
          action={bookings.length === 0 ? <Button href="/book">Book a delivery</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}
