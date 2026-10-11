/**
 * Google Maps Platform configuration & documentation.
 *
 * ── Which APIs must be enabled in Google Cloud ──────────────────────────────
 *   1. Places API (New)          → address autocomplete + place details
 *                                  (server routes: /api/maps/autocomplete, /api/maps/place)
 *   2. Routes API                → distance, duration and multi-stop / return
 *                                  routing (server route: /api/maps/route)
 *   3. Maps JavaScript API       → the interactive map preview in the browser
 *                                  (uses NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
 *
 * ── Key strategy ───────────────────────────────────────────────────────────
 *   • GOOGLE_MAPS_API_KEY (server only) — Places (New) + Routes. Restrict to
 *     these two APIs and, ideally, to your server IP. Never sent to the browser.
 *   • NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (browser) — Maps JavaScript API only.
 *     Its "Websites" restriction MUST list every origin you serve from, each as
 *     `<origin>/*` (e.g. `http://localhost:3000/*`, `https://your-domain.com/*`).
 *     A missing origin → `RefererNotAllowedMapError`; RouteMap detects this via
 *     `window.gm_authFailure` and shows the no-map fallback (routing unaffected).
 *
 * ── Cost control (implemented in lib/maps) ─────────────────────────────────
 *   • Autocomplete requests are debounced (400ms) on the client.
 *   • A single Places *session token* is reused for a whole address entry and
 *     discarded after Place Details is fetched (Google bills the session, not
 *     each keystroke).
 *   • Selected places (formatted address + coords + placeId) are cached in the
 *     booking state — re-selecting never re-hits the API.
 *   • The route is only computed once every location is resolved, and the
 *     result is memoised against a hash of {pickup, stops, destination, type}.
 *   • The server recomputes the route once more at payment time for price
 *     integrity; that single authoritative call is the only server-trusted one.
 */

export const MAPS_CONFIG = {
  /** Debounce for autocomplete keystrokes (ms). */
  autocompleteDebounceMs: 400,
  /** Minimum characters before we call autocomplete. */
  autocompleteMinChars: 3,
  /** Bias results toward this region. */
  region: "ng",
  language: "en",
  /** Places Autocomplete (New) endpoint. */
  placesAutocompleteUrl: "https://places.googleapis.com/v1/places:autocomplete",
  /** Place Details (New) endpoint. */
  placeDetailsUrl: (placeId: string) => `https://places.googleapis.com/v1/places/${placeId}`,
  /** Routes API — Compute Routes. */
  computeRoutesUrl: "https://routes.googleapis.com/directions/v2:computeRoutes",
  /** Default map centre when nothing is selected (Lagos). */
  defaultCenter: { lat: 6.5244, lng: 3.3792 },
  defaultZoom: 11,
} as const;

/** Fallback average speed (km/h) for ETA when Routes API is not configured. */
export const FALLBACK_AVERAGE_SPEED_KMH = 24;
