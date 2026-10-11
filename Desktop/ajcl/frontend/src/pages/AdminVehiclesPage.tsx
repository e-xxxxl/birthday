import { AdminVehiclesView } from "@/components/admin/AdminVehiclesView";
import { LoadingBlock, Alert } from "@/components/ui/Feedback";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http } from "@/lib/http";
import type { AdminVehicle } from "@/types/admin";

export function AdminVehiclesPage() {
  useDocumentTitle("Vehicles & pricing");
  const { data, loading, error, reload } = useAsync(
    () => http.get<{ vehicles: AdminVehicle[] }>("/api/admin/vehicles"),
    [],
  );

  if (loading && !data) return <LoadingBlock />;
  if (error || !data) {
    return (
      <Alert tone="danger">
        {error ?? "Could not load vehicles."}{" "}
        <button type="button" onClick={reload} className="font-semibold underline">
          Retry
        </button>
      </Alert>
    );
  }

  return <AdminVehiclesView key={data.vehicles.map((v) => v.id).join(",")} initialVehicles={data.vehicles} />;
}
