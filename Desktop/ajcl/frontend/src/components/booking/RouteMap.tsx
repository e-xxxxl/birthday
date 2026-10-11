
import { useEffect, useRef, useState } from "react";
import { loadMapsJs, mapsAuthFailed, onMapsAuthFailure } from "@/lib/maps/client";
import { MAPS_CONFIG } from "@/config/maps";
import type { LocationDTO } from "@/types";

type Point = { lat: number; lng: number; kind: "pickup" | "stop" | "destination" };

function pointsFrom(
  pickup: LocationDTO | null,
  stops: LocationDTO[],
  destination: LocationDTO | null,
): Point[] {
  const out: Point[] = [];
  if (pickup?.lat != null && pickup.lng != null)
    out.push({ lat: pickup.lat, lng: pickup.lng, kind: "pickup" });
  for (const s of stops) {
    if (s.lat != null && s.lng != null) out.push({ lat: s.lat, lng: s.lng, kind: "stop" });
  }
  if (destination?.lat != null && destination.lng != null)
    out.push({ lat: destination.lat, lng: destination.lng, kind: "destination" });
  return out;
}

export function RouteMap({
  browserKey,
  pickup,
  stops,
  destination,
  polyline,
}: {
  browserKey: string | null;
  pickup: LocationDTO | null;
  stops: LocationDTO[];
  destination: LocationDTO | null;
  polyline?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<google.maps.MVCObject[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  const points = pointsFrom(pickup, stops, destination);
  const key = points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join("|") + `#${polyline ?? ""}`;

  useEffect(() => {
    let cancelled = false;

    // Google fires this if the key is bad / the origin isn't in the referrer
    // allow-list — show the clean placeholder rather than a broken map.
    const unsub = onMapsAuthFailure(() => !cancelled && setStatus("unavailable"));

    loadMapsJs(browserKey).then((maps) => {
      if (cancelled || mapsAuthFailed()) {
        if (!cancelled) setStatus("unavailable");
        return;
      }
      if (!maps || !ref.current) {
        setStatus("unavailable");
        return;
      }
      if (!mapRef.current) {
        try {
          mapRef.current = new maps.Map(ref.current, {
            center: MAPS_CONFIG.defaultCenter,
            zoom: MAPS_CONFIG.defaultZoom,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: "cooperative",
          });
        } catch {
          setStatus("unavailable");
          return;
        }
      }
      setStatus(mapsAuthFailed() ? "unavailable" : "ready");
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [browserKey]);

  useEffect(() => {
    const maps = window.google?.maps;
    const map = mapRef.current;
    if (status !== "ready" || !maps || !map) return;

    overlaysRef.current.forEach((o) => (o as unknown as { setMap: (m: null) => void }).setMap(null));
    overlaysRef.current = [];

    if (points.length === 0) {
      map.setCenter(MAPS_CONFIG.defaultCenter);
      map.setZoom(MAPS_CONFIG.defaultZoom);
      return;
    }

    const bounds = new maps.LatLngBounds();
    points.forEach((p) => {
      const color =
        p.kind === "pickup" ? "#15803d" : p.kind === "destination" ? "#b91c1c" : "#e09a00";
      const marker = new maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });
      overlaysRef.current.push(marker);
      bounds.extend({ lat: p.lat, lng: p.lng });
    });

    let path: google.maps.LatLngLiteral[] = points.map((p) => ({ lat: p.lat, lng: p.lng }));
    if (polyline && maps.geometry?.encoding) {
      try {
        path = maps.geometry.encoding
          .decodePath(polyline)
          .map((ll) => ({ lat: ll.lat(), lng: ll.lng() }));
      } catch {
        /* fall back to straight lines */
      }
    }

    const line = new maps.Polyline({
      path,
      map,
      strokeColor: "#141414",
      strokeOpacity: 0.85,
      strokeWeight: 4,
    });
    overlaysRef.current.push(line);

    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(14);
    } else {
      map.fitBounds(bounds, 48);
    }
  }, [status, key]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface">
      <div ref={ref} className="h-64 w-full lg:h-[420px]" />
      {status !== "ready" ? (
        <div className="absolute inset-0 grid place-items-center bg-surface text-center text-sm text-muted">
          {status === "loading" ? (
            "Loading map…"
          ) : (
            <div className="max-w-xs px-6">
              <p className="font-semibold text-ink">Map preview unavailable</p>
              <p className="mt-1 text-xs">
                The route is still calculated on the server — distance and price are unaffected.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
