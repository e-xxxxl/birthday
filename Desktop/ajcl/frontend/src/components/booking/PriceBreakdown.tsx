import { formatNaira } from "@/lib/utils";
import type { PriceBreakdownDTO } from "@/types";

/**
 * Fare display. We only ever show the customer the final total — never the
 * per-kilometre rate or how it was worked out.
 */
export function PriceBreakdown({
  price,
  compact = false,
}: {
  price: PriceBreakdownDTO;
  compact?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={compact ? "text-sm font-semibold" : "text-sm font-bold uppercase tracking-wide text-muted"}>
        Total
      </span>
      <span className={compact ? "text-base font-bold tabular-nums" : "text-2xl font-bold tabular-nums"}>
        {formatNaira(price.total)}
      </span>
    </div>
  );
}
