import type { ProofDTO, VehicleDTO } from "./index";

/** A recent pickup/delivery proof, with the booking it belongs to. */
export type RecentProof = ProofDTO & { bookingReference: string };

/** Vehicle row in the admin catalogue — includes live fleet utilisation. */
export type AdminVehicle = VehicleDTO & { unitsInUse?: number };

export type AdminStats = {
  totalBookings: number;
  pendingBookings: number;
  activeDeliveries: number;
  completedDeliveries: number;
  cancelledBookings: number;
  revenue: number;
  revenueThisMonth: number;
  customers: number;
  recentBookings: number;
};

export type AdminAuditEntry = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  actorRole: "system" | "customer" | "admin";
  actorName: string | null;
  at: string;
};

export type AdminPaymentEntry = {
  id: string;
  reference: string;
  status: string;
  amount: number;
  currency: string;
  channel: string | null;
  verifiedVia: "none" | "callback" | "webhook";
  paidAt: string | null;
  gatewayResponse: string | null;
  createdAt: string;
};
