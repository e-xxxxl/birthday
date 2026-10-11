import { useSearchParams } from "react-router-dom";
import { AdminBookingsView } from "@/components/admin/AdminBookingsView";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function AdminBookingsPage() {
  useDocumentTitle("Bookings");
  const [params] = useSearchParams();
  return <AdminBookingsView initialStatus={params.get("status") || "all"} />;
}
