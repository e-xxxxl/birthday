
import { composeAddress } from "@/lib/maps/address";
import { http } from "@/lib/http";
import type { LocationDTO } from "@/types";
import { MAPS_CONFIG } from "@/config/maps";

/* ─────────────────────────────────────────────────────────────────────────
   Google Maps — client side.

   The booking flow runs Places Autocomplete, Place Details and route
   calculation in the BROWSER using NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. That key
   is HTTP-referrer restricted (as it should be), which is fine here — the
   Maps JavaScript API accepts referrer-restricted keys. The server key
   (GOOGLE_MAPS_API_KEY) is only an optional cross-check; everything works
   with the browser key alone.
   ───────────────────────────────────────────────────────────────────────── */

export type Prediction = {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  fullText: string;
};

export type ClientRoute = {
  distanceKm: number;
  returnLegKm: number;
  durationSeconds: number;
  polyline?: string;
  source: "google";
};

/* ── auth-failure signalling (shared with RouteMap) ─────────────────────── */

let authFailed = false;
const authFailureSubs = new Set<() => void>();

export function mapsAuthFailed(): boolean {
  return authFailed;
}

export function onMapsAuthFailure(cb: () => void): () => void {
  authFailureSubs.add(cb);
  if (authFailed) cb();
  return () => authFailureSubs.delete(cb);
}

function installAuthFailureHook() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gm_authFailure?: () => void };
  const prev = w.gm_authFailure;
  w.gm_authFailure = () => {
    authFailed = true;
    if (import.meta.env.DEV) {
      console.warn(
        "[maps] Google Maps auth failed. Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is valid and its " +
          `"Websites" restriction allows ${window.location.origin}/* — and that Maps JavaScript API + ` +
          "Places API (New) + Routes API are enabled. Falling back to manual entry / estimates.",
      );
    }
    authFailureSubs.forEach((cb) => cb());
    prev?.();
  };
}

/* ── loader ────────────────────────────────────────────────────────────── */

let mapsPromise: Promise<typeof google.maps | null> | null = null;

export function loadMapsJs(browserKey: string | null): Promise<typeof google.maps | null> {
  if (!browserKey) return Promise.resolve(null);
  if (typeof window === "undefined") return Promise.resolve(null);
  if (authFailed) return Promise.resolve(null);
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (mapsPromise) return mapsPromise;

  installAuthFailureHook();

  mapsPromise = new Promise((resolve) => {
    // Never hang the caller — resolve null if the script hasn't loaded in 12s.
    const timer = setTimeout(() => resolve(window.google?.maps ?? null), 12_000);
    const done = (v: typeof google.maps | null) => {
      clearTimeout(timer);
      resolve(v);
    };
    const existing = document.getElementById("gmaps-js") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => done(window.google?.maps ?? null));
      existing.addEventListener("error", () => done(null));
      return;
    }
    const script = document.createElement("script");
    script.id = "gmaps-js";
    script.async = true;
    // No `loading=async`: it defers the core namespace and would break the
    // direct `new google.maps.Map()` in RouteMap. `importLibrary` still works.
    // DirectionsService is part of the core API (no library needed).
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(browserKey)}` +
      `&v=weekly&libraries=geometry,places`;
    script.onload = () => done(window.google?.maps ?? null);
    script.onerror = () => done(null);
    document.head.appendChild(script);
  });

  return mapsPromise;
}

type PlacesLib = google.maps.PlacesLibrary;
type RoutesLib = google.maps.RoutesLibrary;

let placesLib: Promise<PlacesLib | null> | null = null;
let routesLib: Promise<RoutesLib | null> | null = null;

async function getPlaces(browserKey: string | null): Promise<PlacesLib | null> {
  if (placesLib) return placesLib;
  placesLib = (async () => {
    const maps = await loadMapsJs(browserKey);
    if (!maps) return null;
    // `libraries=places` populates `maps.places` directly; importLibrary is the
    // modern path. Use whichever is available.
    if (maps.places?.AutocompleteSuggestion || maps.places?.AutocompleteService) {
      return maps.places as unknown as PlacesLib;
    }
    try {
      return (await maps.importLibrary("places")) as PlacesLib;
    } catch {
      return (maps.places as unknown as PlacesLib) ?? null;
    }
  })();
  return placesLib;
}

async function getRoutes(browserKey: string | null): Promise<RoutesLib | null> {
  if (routesLib) return routesLib;
  routesLib = (async () => {
    const maps = await loadMapsJs(browserKey);
    if (!maps) return null;
    if (maps.DirectionsService) return maps as unknown as RoutesLib;
    try {
      return (await maps.importLibrary("routes")) as RoutesLib;
    } catch {
      return maps.DirectionsService ? (maps as unknown as RoutesLib) : null;
    }
  })();
  return routesLib;
}

/* ── session tokens ────────────────────────────────────────────────────── */

/** UUID for the server-side autocomplete fallback. */
export function newSessionToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `st-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

export type SearchSession = {
  /** Google session token object (client) or a UUID string (server fallback). */
  token: unknown;
};

export async function newSearchSession(browserKey: string | null): Promise<SearchSession> {
  const places = await getPlaces(browserKey);
  if (places?.AutocompleteSessionToken) {
    try {
      return { token: new places.AutocompleteSessionToken() };
    } catch {
      /* fall through */
    }
  }
  return { token: newSessionToken() };
}

/* ── autocomplete ──────────────────────────────────────────────────────── */

export type AutocompleteOutcome = {
  predictions: Prediction[];
  /** "client" = Maps JS in the browser, "server" = /api/maps, "none" = not configured. */
  source: "client" | "server" | "none";
  error?: string;
};

export async function searchAddresses(
  input: string,
  session: SearchSession,
  browserKey: string | null,
): Promise<AutocompleteOutcome> {
  if (input.trim().length < MAPS_CONFIG.autocompleteMinChars) {
    return { predictions: [], source: browserKey ? "client" : "none" };
  }

  // 1) Browser key → run in the browser (works with referrer-restricted keys).
  if (browserKey && !authFailed) {
    const places = await getPlaces(browserKey);

    // 1a) Places API (New) — the current, recommended API.
    if (places?.AutocompleteSuggestion) {
      try {
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: session.token as google.maps.places.AutocompleteSessionToken,
          includedRegionCodes: [MAPS_CONFIG.region.toUpperCase()],
          language: MAPS_CONFIG.language,
        });
        const predictions: Prediction[] = (suggestions ?? [])
          .map((s) => s.placePrediction)
          .filter((p): p is google.maps.places.PlacePrediction => Boolean(p?.placeId))
          .map((p) => ({
            placeId: p.placeId,
            primaryText: p.mainText?.text ?? p.text?.text ?? "",
            secondaryText: p.secondaryText?.text ?? "",
            fullText: p.text?.text ?? "",
          }));
        if (predictions.length > 0) return { predictions, source: "client" };
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("[maps] Places (New) autocomplete failed, trying legacy:", err);
        }
      }
    }

    // 1b) Legacy AutocompleteService — for keys that only have the old
    //     "Places API" enabled (common when a key came from an older project).
    if (places?.AutocompleteService) {
      const legacy = await legacyAutocomplete(places, input, session.token);
      if (legacy) return { predictions: legacy, source: "client" };
    }
  }

  // 2) Server fallback (needs an unrestricted GOOGLE_MAPS_API_KEY).
  try {
    const res = await http.post<{ predictions: Prediction[]; configured: boolean; error?: string }>(
      "/api/maps/autocomplete",
      { input, sessionToken: typeof session.token === "string" ? session.token : newSessionToken() },
    );
    return {
      predictions: res.predictions,
      source: res.configured ? "server" : "none",
      error: res.error,
    };
  } catch {
    return { predictions: [], source: "none", error: "Address search is unavailable." };
  }
}

/* ── legacy Places fallbacks (deprecated API, still widely enabled) ─────── */

function legacyAutocomplete(
  places: PlacesLib,
  input: string,
  token: unknown,
): Promise<Prediction[] | null> {
  return new Promise((resolve) => {
    try {
      const svc = new places.AutocompleteService();
      svc.getPlacePredictions(
        {
          input,
          sessionToken: token as google.maps.places.AutocompleteSessionToken,
          componentRestrictions: { country: MAPS_CONFIG.region },
        },
        (preds, status) => {
          if (status !== "OK" || !preds) {
            resolve(null);
            return;
          }
          resolve(
            preds.map((p) => ({
              placeId: p.place_id,
              primaryText: p.structured_formatting?.main_text ?? p.description,
              secondaryText: p.structured_formatting?.secondary_text ?? "",
              fullText: p.description,
            })),
          );
        },
      );
    } catch {
      resolve(null);
    }
  });
}

function legacyPlaceDetails(
  places: PlacesLib,
  placeId: string,
  token: unknown,
): Promise<LocationDTO | null> {
  return new Promise((resolve) => {
    try {
      const svc = new places.PlacesService(document.createElement("div"));
      svc.getDetails(
        {
          placeId,
          fields: ["formatted_address", "geometry.location", "name", "address_components"],
          sessionToken: token as google.maps.places.AutocompleteSessionToken,
        },
        (place, status) => {
          const loc = place?.geometry?.location;
          if (status !== "OK" || !place || !loc) {
            resolve(null);
            return;
          }
          resolve({
            ...composeAddress({
              formattedAddress: place.formatted_address ?? place.name ?? "",
              displayName: place.name,
              components: (place.address_components ?? []).map((c) => ({
                longText: c.long_name,
                types: c.types,
              })),
            }),
            lat: loc.lat(),
            lng: loc.lng(),
            placeId,
            manual: false,
          });
        },
      );
    } catch {
      resolve(null);
    }
  });
}

/* ── place details ─────────────────────────────────────────────────────── */

export async function resolveAddress(
  placeId: string,
  session: SearchSession,
  browserKey: string | null,
): Promise<LocationDTO | null> {
  if (browserKey && !authFailed) {
    const places = await getPlaces(browserKey);

    if (places?.Place) {
      try {
        const place = new places.Place({ id: placeId });
        await place.fetchFields({
          fields: ["formattedAddress", "location", "displayName", "addressComponents"],
        });
        const loc = place.location;
        if (loc) {
          return {
            ...composeAddress({
              formattedAddress: place.formattedAddress ?? place.displayName ?? "",
              displayName: place.displayName,
              components: (place.addressComponents ?? []).map((c) => ({
                longText: c.longText ?? "",
                types: c.types,
              })),
            }),
            lat: loc.lat(),
            lng: loc.lng(),
            placeId,
            manual: false,
          };
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("[maps] Place (New) details failed, trying legacy:", err);
        }
      }
    }

    if (places?.PlacesService) {
      const legacy = await legacyPlaceDetails(places, placeId, session.token);
      if (legacy) return legacy;
    }
  }

  try {
    const { place } = await http.post<{
      place: {
        placeId: string;
        formattedAddress: string;
        name?: string;
        area?: string;
        city?: string;
        state?: string;
        location: { lat: number; lng: number };
      };
    }>("/api/maps/place", {
      placeId,
      sessionToken: typeof session.token === "string" ? session.token : newSessionToken(),
    });
    return {
      formattedAddress: place.formattedAddress,
      name: place.name,
      area: place.area,
      city: place.city,
      state: place.state,
      lat: place.location.lat,
      lng: place.location.lng,
      placeId: place.placeId,
      manual: false,
    };
  } catch {
    return null;
  }
}

/* ── routing (client-side) ────────────────────────────────────────────────
   Prefers the current Route.computeRoutes (Routes API); falls back to the
   still-supported DirectionsService (Directions API) so it works whichever
   API the key has enabled.
   ─────────────────────────────────────────────────────────────────────── */

type Pt = { lat: number; lng: number };
const km2 = (m: number) => Math.round((m / 1000) * 100) / 100;

/** Resolve `null` if `p` doesn't settle in `ms` — Google SDK calls can hang on auth errors. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]);
}

export async function computeClientRoute(
  points: Pt[],
  opts: { returnToOrigin?: boolean },
  browserKey: string | null,
): Promise<ClientRoute | null> {
  if (!browserKey || authFailed || points.length < 2) return null;
  return withTimeout(computeClientRouteInner(points, opts, browserKey), 9_000);
}

async function computeClientRouteInner(
  points: Pt[],
  opts: { returnToOrigin?: boolean },
  browserKey: string | null,
): Promise<ClientRoute | null> {

  const routes = await getRoutes(browserKey);
  const maps = window.google?.maps;
  if (!maps) return null;

  const full = opts.returnToOrigin ? [...points, points[0]] : points;
  const origin = full[0];
  const destination = full[full.length - 1];
  const intermediates = full.slice(1, -1);

  // 1) Routes API — the current recommended path.
  const routeCls = routes?.Route;
  if (routeCls?.computeRoutes) {
    try {
      const { routes: results } = await routeCls.computeRoutes({
        origin,
        destination,
        intermediates: intermediates.map((p) => ({ location: p })),
        travelMode: "DRIVING",
        fields: ["distanceMeters", "durationMillis", "legs", "path"],
      });
      const r = results?.[0];
      if (r && typeof r.distanceMeters === "number" && r.distanceMeters > 0) {
        const legMeters = (r.legs ?? []).map((l) => l.distanceMeters ?? 0);
        const returnLegMeters = opts.returnToOrigin ? (legMeters.at(-1) ?? 0) : 0;
        let polyline: string | undefined;
        try {
          const path = r.path;
          if (path && maps.geometry?.encoding) {
            polyline = maps.geometry.encoding.encodePath(
              path.map((p) => ({ lat: p.lat, lng: p.lng })) as unknown as google.maps.LatLng[],
            );
          }
        } catch {
          /* polyline is best-effort — RouteMap falls back to straight lines */
        }
        return {
          distanceKm: km2(r.distanceMeters),
          returnLegKm: km2(returnLegMeters),
          durationSeconds: Math.round((r.durationMillis ?? 0) / 1000),
          polyline,
          source: "google",
        };
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("[maps] Route.computeRoutes failed, trying DirectionsService:", err);
      }
    }
  }

  // 2) DirectionsService fallback.
  if (!routes?.DirectionsService) return null;
  try {
    const svc = new routes.DirectionsService();
    const res = await svc.route({
      origin,
      destination,
      waypoints: intermediates.map((p) => ({ location: p, stopover: true })),
      travelMode: maps.TravelMode.DRIVING,
      optimizeWaypoints: false,
    });
    const route = res.routes[0];
    if (!route) return null;

    const legMeters = route.legs.map((l) => l.distance?.value ?? 0);
    const legSeconds = route.legs.map((l) => l.duration?.value ?? 0);
    const returnLegMeters = opts.returnToOrigin ? (legMeters.at(-1) ?? 0) : 0;

    let polyline: string | undefined;
    if (route.overview_path && maps.geometry?.encoding) {
      polyline = maps.geometry.encoding.encodePath(route.overview_path);
    }

    return {
      distanceKm: km2(legMeters.reduce((a, b) => a + b, 0)),
      returnLegKm: km2(returnLegMeters),
      durationSeconds: Math.round(legSeconds.reduce((a, b) => a + b, 0)),
      polyline,
      source: "google",
    };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[maps] DirectionsService route failed:", err);
    }
    return null;
  }
}
