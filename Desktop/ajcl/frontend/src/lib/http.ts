/** Centralised client fetch — talks to the Render API, sends the Bearer token,
 *  unwraps `{ ok, data }`. */

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: string; details?: Record<string, string[]> };

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/+$/, "");
const TOKEN_KEY = "ajc_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode / storage disabled — auth just won't persist */
  }
}

export class HttpError extends Error {
  status: number;
  details?: Record<string, string[]>;
  constructor(message: string, status: number, details?: Record<string, string[]>) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

type Options = Omit<RequestInit, "body"> & { body?: unknown };

function resolveUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/api/${path}`;
  return `${API_URL}${p}`;
}

export async function api<T = unknown>(path: string, options: Options = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const token = getToken();

  const res = await fetch(resolveUrl(path), {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let json: ApiOk<T> | ApiErr | null = null;
  try {
    json = (await res.json()) as ApiOk<T> | ApiErr;
  } catch {
    /* fall through */
  }

  if (!res.ok || !json || json.ok === false) {
    const err = json && json.ok === false ? json : null;
    if (res.status === 401) {
      setToken(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ajc:unauthorized"));
      }
    }
    throw new HttpError(err?.error ?? `Request failed (${res.status})`, res.status, err?.details);
  }

  return json.data;
}

/** Fetch a protected file (e.g. a proof photo) as a Blob, sending the login token. */
export async function fetchBlob(path: string): Promise<Blob> {
  const token = getToken();
  const res = await fetch(resolveUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    if (res.status === 401) {
      setToken(null);
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("ajc:unauthorized"));
    }
    throw new HttpError(`Could not load the file (${res.status})`, res.status);
  }
  return res.blob();
}

export const http = {
  get: <T,>(path: string, options?: Options) => api<T>(path, { ...options, method: "GET" }),
  post: <T,>(path: string, body?: unknown, options?: Options) =>
    api<T>(path, { ...options, method: "POST", body }),
  patch: <T,>(path: string, body?: unknown, options?: Options) =>
    api<T>(path, { ...options, method: "PATCH", body }),
  put: <T,>(path: string, body?: unknown, options?: Options) =>
    api<T>(path, { ...options, method: "PUT", body }),
  del: <T,>(path: string, options?: Options) => api<T>(path, { ...options, method: "DELETE" }),
};

/** Absolute URL for an API path (for images, downloads and links that the browser fetches itself). */
export function apiUrl(path: string): string {
  return resolveUrl(path);
}
