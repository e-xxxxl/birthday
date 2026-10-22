import { useState } from "react";
import { cn } from "@/lib/utils";
import { isPlusCode } from "@/lib/maps/address";
import type { LocationDTO } from "@/types";

/** Google Maps link for a location: the exact pin when we have coordinates, else a text search. */
export function mapsHref(loc: Pick<LocationDTO, "formattedAddress" | "lat" | "lng" | "details" | "name">): string {
  const query =
    typeof loc.lat === "number" && typeof loc.lng === "number"
      ? `${loc.lat},${loc.lng}`
      : [loc.name, loc.formattedAddress].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Everything a rider needs, as one line of text (for copying or sharing). */
export function fullAddressText(loc: LocationDTO): string {
  return [loc.details, loc.name, loc.formattedAddress]
    .filter((v, i, all) => v && all.indexOf(v) === i)
    .join(", ");
}

/** Area / city / state, minus whatever the formatted address already says. */
function placeLine(loc: LocationDTO): string {
  const formatted = loc.formattedAddress.toLowerCase();
  return [loc.area, loc.city, loc.state]
    .filter((p): p is string => Boolean(p) && !formatted.includes((p as string).toLowerCase()))
    .join(", ");
}

/** The address as readable lines: door details first, then the place and street address. */
export function AddressLines({ loc, className }: { loc: LocationDTO | null | undefined; className?: string }) {
  if (!loc?.formattedAddress) return null;
  const extra = placeLine(loc);
  const approximate = isPlusCode(loc.formattedAddress);
  const showName = loc.name && !loc.formattedAddress.toLowerCase().includes(loc.name.toLowerCase());
  return (
    <div className={cn("min-w-0 space-y-0.5 text-sm", className)}>
      {loc.details ? <p className="font-semibold text-ink [overflow-wrap:anywhere]">{loc.details}</p> : null}
      {showName ? <p className="font-medium text-ink-soft [overflow-wrap:anywhere]">{loc.name}</p> : null}
      <p className="text-ink-soft [overflow-wrap:anywhere]">{loc.formattedAddress}</p>
      {extra ? <p className="text-xs text-muted">{extra}</p> : null}
      {approximate ? (
        <p className="text-xs font-medium text-[var(--color-warning)]">
          Approximate location. Use the map link for the exact pin.
        </p>
      ) : null}
    </div>
  );
}

/** "Open in Maps" and "Copy address" buttons. */
export function AddressActions({ loc, className }: { loc: LocationDTO | null | undefined; className?: string }) {
  const [copied, setCopied] = useState(false);
  if (!loc?.formattedAddress) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullAddressText(loc as LocationDTO));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable: the address is on screen */
    }
  }

  const btn =
    "inline-flex items-center rounded-sm border border-line-strong px-3 py-1 text-xs font-semibold text-ink-soft transition hover:border-ink hover:text-ink";
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <a href={mapsHref(loc)} target="_blank" rel="noreferrer" className={btn}>
        Open in Maps
      </a>
      <button type="button" onClick={copy} className={btn}>
        {copied ? "Copied" : "Copy address"}
      </button>
    </div>
  );
}
