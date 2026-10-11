import { cn } from "@/lib/utils";
import { AddressLines } from "@/components/common/AddressBlock";
import type { LocationDTO } from "@/types";

export function RouteSummary({
  pickup,
  stops,
  destination,
  deliveryType,
  className,
}: {
  pickup: LocationDTO | null;
  stops: LocationDTO[];
  destination: LocationDTO | null;
  deliveryType?: "single" | "return";
  className?: string;
}) {
  const rows: { tone: "pickup" | "stop" | "destination" | "return"; label: string; loc?: LocationDTO | null }[] = [
    { tone: "pickup", label: "Pickup", loc: pickup },
    ...stops.map((s, i) => ({ tone: "stop" as const, label: `Stop ${i + 1}`, loc: s })),
    { tone: "destination", label: "Destination", loc: destination },
  ];
  if (deliveryType === "return" && pickup) {
    rows.push({ tone: "return", label: "Return to pickup", loc: { formattedAddress: pickup.formattedAddress } });
  }

  return (
    <ul className={cn("space-y-0", className)}>
      {rows.map((row, i) => {
        const dot =
          row.tone === "pickup"
            ? "bg-[var(--color-success)]"
            : row.tone === "destination"
              ? "bg-[var(--color-danger)]"
              : row.tone === "return"
                ? "bg-navy"
                : "bg-accent";
        return (
          <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
            <div className="flex flex-col items-center">
              <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", dot)} />
              {i < rows.length - 1 ? <span className="w-px flex-1 bg-line-strong" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{row.label}</p>
              {row.loc?.formattedAddress ? (
                <AddressLines loc={row.loc} />
              ) : (
                <p className="text-sm italic text-muted">Not set</p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
