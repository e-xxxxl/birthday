import { useCallback, useEffect, useRef, useState } from "react";

export type GeoFix = {
  lat: number;
  lng: number;
  /** GPS accuracy radius in metres. */
  accuracyM: number;
  /** Device time of the fix (ms since epoch). */
  at: number;
};

type State =
  | { status: "locating" }
  | { status: "ready"; fix: GeoFix }
  | { status: "error"; message: string };

const SETTLE_MS = 8_000; // keep refining for a few seconds to get the tightest fix
const GOOD_ENOUGH_M = 20;
const GIVE_UP_MS = 25_000;

/**
 * Captures the rider's exact position. Watches the GPS for a few seconds and keeps the
 * most accurate reading, rather than trusting the first (often coarse) one.
 * `capture()` refreshes it; `ensureFresh()` returns a fix no older than `maxAgeMs`.
 */
export function useGeoFix() {
  const [state, setState] = useState<State>({ status: "locating" });
  const watchId = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  const latest = useRef<GeoFix | null>(null);

  const stop = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const capture = useCallback((): Promise<GeoFix> => {
    stop();
    setState({ status: "locating" });

    return new Promise<GeoFix>((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        const message = "This device can't share its location, so the handover can't be confirmed.";
        setState({ status: "error", message });
        reject(new Error(message));
        return;
      }

      let best: GeoFix | null = null;
      let settled = false;

      const finish = (fix: GeoFix | null, errMsg?: string) => {
        if (settled) return;
        settled = true;
        stop();
        if (fix) {
          latest.current = fix;
          setState({ status: "ready", fix });
          resolve(fix);
        } else {
          const message = errMsg ?? "Couldn't get your location.";
          setState({ status: "error", message });
          reject(new Error(message));
        }
      };

      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const fix: GeoFix = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracyM: Math.round(pos.coords.accuracy),
            at: pos.timestamp || Date.now(),
          };
          if (!best || fix.accuracyM < best.accuracyM) best = fix;
          // Show progress as the fix tightens.
          setState({ status: "ready", fix: best });
          if (best.accuracyM <= GOOD_ENOUGH_M) finish(best);
        },
        (err) => {
          if (best) return finish(best);
          finish(
            null,
            err.code === err.PERMISSION_DENIED
              ? "Location access is blocked. Allow location for this site in your browser settings, then try again. A handover can't be confirmed without it."
              : err.code === err.TIMEOUT
                ? "Couldn't get a GPS signal. Move outside or near a window and try again."
                : "Couldn't get your location. Check that location is switched on and try again.",
          );
        },
        { enableHighAccuracy: true, timeout: GIVE_UP_MS, maximumAge: 0 },
      );

      timers.current.push(window.setTimeout(() => best && finish(best), SETTLE_MS));
      timers.current.push(window.setTimeout(() => finish(best, "Couldn't get a GPS signal. Move outside or near a window and try again."), GIVE_UP_MS));
    });
  }, [stop]);

  useEffect(() => {
    void capture().catch(() => undefined);
    return stop;
  }, [capture, stop]);

  /** A fix that is at most `maxAgeMs` old, capturing a new one if needed. */
  const ensureFresh = useCallback(
    async (maxAgeMs = 90_000): Promise<GeoFix> => {
      const cur = latest.current;
      if (cur && Date.now() - cur.at <= maxAgeMs) return cur;
      return capture();
    },
    [capture],
  );

  return { state, capture, ensureFresh };
}
