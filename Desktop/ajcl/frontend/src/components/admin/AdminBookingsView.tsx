
import { useCallback, useEffect, useState } from "react";
import { AdminBookingRow } from "@/components/admin/AdminBookingRow";
import { Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { LoadingBlock, EmptyState, Alert } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/providers/AuthProvider";
import { http, HttpError } from "@/lib/http";
import { BOOKING_STATUS_FLOW, PAYMENT_STATUS } from "@/config/booking";
import type { BookingDTO } from "@/types";

type Pagination = { total: number; page: number; pages: number; pageSize: number };

export function AdminBookingsView({ initialStatus }: { initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [payment, setPayment] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const toast = useToast();
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeScope, setPurgeScope] = useState<"cancelled" | "delivered" | "all">("cancelled");
  const [purgeConfirm, setPurgeConfirm] = useState("");
  const [purging, setPurging] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (status !== "all") params.set("status", status);
      if (payment !== "all") params.set("payment", payment);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await http.get<{ bookings: BookingDTO[]; pagination: Pagination }>(
        `/api/admin/bookings?${params.toString()}`,
      );
      setBookings(res.bookings);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Could not load bookings.");
    } finally {
      setLoading(false);
    }
  }, [status, payment, debouncedSearch, from, to, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function purge() {
    setPurging(true);
    try {
      const res = await http.post<{ deleted: number }>("/api/admin/bookings/purge", {
        scope: purgeScope,
        confirm: "DELETE",
      });
      toast.success(
        `${res.deleted} booking${res.deleted === 1 ? "" : "s"} deleted`,
        "Payments and status history were removed too.",
      );
      setPurgeOpen(false);
      setPurgeConfirm("");
      setPage(1);
      await load();
    } catch (err) {
      toast.error("Could not delete", err instanceof HttpError ? err.message : "");
    } finally {
      setPurging(false);
    }
  }

  useEffect(() => {
    setPage(1);
  }, [status, payment, debouncedSearch, from, to]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Bookings</h1>
          {pagination ? (
            <p className="mt-1 text-sm text-muted">{pagination.total} matching</p>
          ) : null}
        </div>
        {user?.superAdmin ? (
          <Button
            variant="secondary"
            size="sm"
            className="border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
            onClick={() => setPurgeOpen(true)}
          >
            Delete bookings…
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 rounded-2xl border border-line bg-paper shadow-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          label="Search"
          placeholder="Reference, name, email, phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          containerClassName="lg:col-span-2"
        />
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {[...BOOKING_STATUS_FLOW, "cancelled", "returned"].map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </Select>
        <Select label="Payment" value={payment} onChange={(e) => setPayment(e.target.value)}>
          <option value="all">All payments</option>
          {Object.values(PAYMENT_STATUS).map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {error ? (
        <Alert tone="danger">
          {error}{" "}
          <button type="button" onClick={load} className="font-semibold underline">
            Retry
          </button>
        </Alert>
      ) : null}

      {loading ? (
        <LoadingBlock />
      ) : bookings.length === 0 ? (
        <EmptyState title="No bookings match these filters" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-card">
          <div className="overflow-x-auto">
            <table className="hidden w-full text-sm md:table">
              <thead className="border-b border-line bg-surface text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-bold">Reference</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Route</th>
                  <th className="px-4 py-3 font-bold">Amount</th>
                  <th className="px-4 py-3 font-bold">Payment</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <AdminBookingRow key={b.id} booking={b} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-line md:hidden">
            {bookings.map((b) => (
              <AdminBookingRow key={b.id} booking={b} card />
            ))}
          </div>
        </div>
      )}

      {pagination && pagination.pages > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}

      <Modal
        open={purgeOpen}
        onClose={() => {
          setPurgeOpen(false);
          setPurgeConfirm("");
        }}
        title="Delete bookings"
        size="md"
      >
        <div className="space-y-4">
          <Alert tone="danger">
            This permanently deletes bookings <strong>and</strong> their payment &amp; status records.
            It cannot be undone.
          </Alert>
          <Select
            label="What to delete"
            value={purgeScope}
            onChange={(e) => setPurgeScope(e.target.value as typeof purgeScope)}
          >
            <option value="cancelled">Only cancelled bookings</option>
            <option value="delivered">Only delivered bookings</option>
            <option value="all">ALL bookings (full wipe)</option>
          </Select>
          <Input
            label={`Type DELETE to confirm`}
            value={purgeConfirm}
            onChange={(e) => setPurgeConfirm(e.target.value)}
            placeholder="DELETE"
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="secondary"
              onClick={() => {
                setPurgeOpen(false);
                setPurgeConfirm("");
              }}
              disabled={purging}
            >
              Cancel
            </Button>
            <Button
              onClick={purge}
              loading={purging}
              disabled={purgeConfirm !== "DELETE"}
              className="bg-[var(--color-danger)] text-paper hover:brightness-110"
            >
              Delete {purgeScope === "all" ? "everything" : `${purgeScope} bookings`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
