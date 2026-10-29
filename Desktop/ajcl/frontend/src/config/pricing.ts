/**
 * Pricing configuration.
 *
 * These are DEFAULT SEED values only. Real per-kilometre rates are managed by
 * the admin from the dashboard (Vehicle documents in MongoDB). Nothing in the
 * booking flow reads from this file at runtime except the pricing formula
 * constants below — the numbers here are used once, to seed the DB.
 *
 *  The business will provide the real ₦/km rates. Do not treat the seed
 *     amounts as final prices.
 */

export type VehicleSeed = {
  slug: string;
  name: string;
  description: string;
  /** Path under /public or a remote URL. */
  image: string;
  /** Default rate — overridden by admin. */
  pricePerKm: number;
  /** Flat fee added once per booking. */
  basePrice: number;
  /** The booking never charges below this. */
  minimumFare: number;
  /** Free-text capacity hint shown on the card. */
  capacity: string;
  /** Average km/h used to estimate ETA when the Routes API is unavailable. */
  averageSpeedKmh: number;
  active: boolean;
  sortOrder: number;
};

/**
 * Seed vehicles. Per-kilometre rates below are the business's current rates;
 * the admin can adjust them at any time from /admin/vehicles without a deploy.
 */
export const VEHICLE_SEEDS: VehicleSeed[] = [
  {
    slug: "bike",
    name: "Bike",
    description:
      "Fast, nimble dispatch rider for documents, parcels and small packages up to 20 kg.",
    image: "/vehicles/bike.svg",
    pricePerKm: 500,
    basePrice: 0,
    minimumFare: 0,
    capacity: "Up to 20 kg · small parcels",
    averageSpeedKmh: 22,
    active: true,
    sortOrder: 1,
  },
  {
    slug: "mini-van",
    name: "Mini Van",
    description:
      "Covered van for bulk parcels, multiple boxes, electronics and fragile items up to 500 kg.",
    image: "/vehicles/mini-van.svg",
    pricePerKm: 1300,
    basePrice: 0,
    minimumFare: 0,
    capacity: "Up to 500 kg · multiple boxes",
    averageSpeedKmh: 28,
    active: true,
    sortOrder: 2,
  },
  {
    slug: "mini-truck",
    name: "Mini Truck",
    description:
      "Open or covered mini truck for furniture, appliances, pallets and heavy loads up to 1,500 kg.",
    image: "/vehicles/mini-truck.svg",
    pricePerKm: 1700,
    basePrice: 0,
    minimumFare: 0,
    capacity: "Up to 1,500 kg · furniture & appliances",
    averageSpeedKmh: 26,
    active: true,
    sortOrder: 3,
  },
  {
    slug: "cargo-van",
    name: "Cargo Van",
    description:
      "Full-size cargo van for bulk loads, stock, equipment and large boxes up to 1,000 kg.",
    image: "/vehicles/cargo-van.jpeg",
    pricePerKm: 1500,
    basePrice: 0,
    minimumFare: 0,
    capacity: "Up to 1,000 kg · bulk cargo & stock",
    averageSpeedKmh: 27,
    active: true,
    sortOrder: 4,
  },
];

/**
 * Pricing formula constants. Kept here so the engine can evolve (surge,
 * per-stop fees, weight multipliers) without touching booking code.
 */
export const PRICING_RULES = {
  /** Extra flat fee for each intermediate stop between pickup and destination. */
  perStopFee: 0,
  /** Multiplier applied to the *return leg* distance for Return Delivery.
   *  1 = charge the return leg at the same rate as the outbound trip. */
  returnLegMultiplier: 1,
  /** VAT / service fee as a fraction of the subtotal (0 = none). */
  taxRate: 0,
  /** Rounding increment for the final total, in Naira. */
  roundToNearest: 1,
  currency: "NGN" as const,
};
