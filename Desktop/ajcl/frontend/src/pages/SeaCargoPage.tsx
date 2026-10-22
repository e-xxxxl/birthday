import { CargoPageView } from "@/components/marketing/CargoPageView";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http } from "@/lib/http";
import type { CargoPage } from "@/types/shipping";

export function SeaCargoPage() {
  useDocumentTitle("Sea cargo");
  const { data, loading, error } = useAsync(() => http.get<{ page: CargoPage }>("/api/site/sea-cargo"), []);
  return (
    <CargoPageView
      service="sea"
      page={data?.page}
      loading={loading}
      error={error}
      crumb="Sea Cargo"
      bannerImage="ships"
      sideImage="containers"
      sideAlt="Shipping containers stacked at a port"
    />
  );
}
