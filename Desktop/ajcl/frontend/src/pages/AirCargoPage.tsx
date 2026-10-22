import { CargoPageView } from "@/components/marketing/CargoPageView";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http } from "@/lib/http";
import type { CargoPage } from "@/types/shipping";

export function AirCargoPage() {
  useDocumentTitle("Air cargo");
  const { data, loading, error } = useAsync(() => http.get<{ page: CargoPage }>("/api/site/air-cargo"), []);
  return (
    <CargoPageView
      service="air"
      page={data?.page}
      loading={loading}
      error={error}
      crumb="Air Cargo"
      bannerImage="cargoPlane"
      sideImage="plane"
      sideAlt="An aircraft wing above the clouds"
    />
  );
}
