import { useEffect, useState } from "react";
import { http } from "@/lib/http";
import type { ShippingConfig } from "@/types/shipping";

/** The public office details and wording. Fetched once per visit and shared by every component that asks. */
let cached: ShippingConfig | null = null;
let pending: Promise<ShippingConfig | null> | null = null;

function load(): Promise<ShippingConfig | null> {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = http
      .get<ShippingConfig>("/api/shipments/config")
      .then((c) => (cached = c))
      .catch(() => null)
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

export function useShippingConfig(): ShippingConfig | null {
  const [config, setConfig] = useState<ShippingConfig | null>(cached);
  useEffect(() => {
    let alive = true;
    void load().then((c) => alive && setConfig(c));
    return () => {
      alive = false;
    };
  }, []);
  return config;
}
