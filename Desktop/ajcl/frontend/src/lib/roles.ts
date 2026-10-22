import type { SessionUser } from "@/types";

/** Office Admins and admins both work in the staff area. */
export function isStaff(role?: SessionUser["role"] | null): boolean {
  return role === "admin" || role === "office_admin";
}

/** Where each kind of account lands after signing in. */
export function homeFor(role?: SessionUser["role"] | null): string {
  if (role === "admin") return "/admin";
  if (role === "office_admin") return "/admin/shipments";
  if (role === "rider") return "/rider";
  return "/dashboard";
}
