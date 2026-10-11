import { BookingWizard } from "@/components/booking/BookingWizard";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http } from "@/lib/http";
import type { VehicleDTO } from "@/types";

export function BookPage() {
  useDocumentTitle("Book a delivery");
  const { data } = useAsync(() => http.get<{ vehicles: VehicleDTO[] }>("/api/vehicles"), []);

  return (
    <BookingWizard
      fallbackVehicles={data?.vehicles ?? []}
      mapBrowserKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || null}
      paystackConfigured={Boolean(import.meta.env.VITE_PAYSTACK_PUBLIC_KEY)}
    />
  );
}
