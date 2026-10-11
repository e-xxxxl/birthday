import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names and resolve Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Narrow no-break space (U+202F) — keeps the ₦ glyph off the digits (Quicksand
 *  has no ₦, so it renders in a fallback font) without allowing a line break. */
const NAIRA_GAP = " ";

/** Format a number as Nigerian Naira (no decimals for whole amounts). */
export function formatNaira(amount: number): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const hasFraction = rounded % 1 !== 0;
  return `₦${NAIRA_GAP}${rounded.toLocaleString("en-NG", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Format kilometres for display. */
export function formatKm(km: number): string {
  return `${km.toLocaleString("en-NG", { maximumFractionDigits: 1 })} km`;
}

/** Format a duration given in seconds as e.g. "1 hr 24 min". */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds / 60));
  const hrs = Math.floor(total / 60);
  const mins = total % 60;
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
}

/** Human-friendly date, e.g. "Mon, 26 Aug 2026". */
export function formatDate(value: string | number | Date): string {
  return new Date(value).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Human-friendly date + time. */
export function formatDateTime(value: string | number | Date): string {
  return new Date(value).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Relative time, e.g. "3 min ago", "2 days ago". */
export function timeAgo(value: string | number | Date): string {
  const diff = Date.now() - new Date(value).getTime();
  const abs = Math.abs(diff);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000000],
    ["month", 2592000000],
    ["day", 86400000],
    ["hour", 3600000],
    ["minute", 60000],
    ["second", 1000],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === "second") {
      return rtf.format(-Math.round(diff / ms), unit);
    }
  }
  return "just now";
}

/** Generate a booking reference like "AJC-8F3K2Q". */
export function generateBookingReference(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `AJC-${code}`;
}

/** Slugify a string for use in ids. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Small helper to pause execution. */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
