import type { ShipmentStatus, ShipmentType } from "@/config/shipping";

export type Party = {
  name: string;
  phone: string;
  email?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  zip?: string;
};

export type Dimensions = { lengthCm?: number; widthCm?: number; heightCm?: number };

export type ShipmentItem = { description: string; quantity: number; value: number; currency: string; hsCode?: string };

export type QuoteOption = {
  rateId: string;
  carrierName: string;
  carrierLogo?: string;
  service?: string;
  deliveryTime?: string;
  sourceAmount: number;
  sourceCurrency: string;
  fxRate: number;
  fxRateUpdatedAt?: string;
  baseRate: number;
  tierPercent: number;
  markup: number;
  flatFee: number;
  surcharge: number;
  total: number;
  manual: boolean;
};

export type RefundRecord = { amount: number; reason: string; reference?: string; markedAt?: string; byName?: string };

export type Shipment = {
  id: string;
  reference: string;
  shipmentType: ShipmentType;
  status: ShipmentStatus;
  createdAt?: string;
  updatedAt?: string;
  customer?: { name: string; email: string; phone: string };
  sender: Party;
  receiver: Party;
  parcel: {
    description: string;
    estimatedWeightKg: number;
    dimensions: Dimensions;
    declaredValue: number;
    items: ShipmentItem[];
  };
  handover: {
    method: "pickup" | "dropoff";
    pickupBookingReference?: string;
    pickupFee?: { amount: number; paid: boolean; status: string; bookingStatus: string };
    receivedAt?: string;
    receivedByName?: string;
    officeCodeViews?: { byName: string; at: string }[];
  };
  confirmed?: { weightKg: number; dimensions: Dimensions; note?: string; at?: string; byName?: string };
  quote: {
    billedWeightKg?: number;
    manualRequired: boolean;
    options: QuoteOption[];
    selectedRateId?: string;
    sentAt?: string;
    draft?: boolean;
  };
  shippingPayment?: { paid: boolean; amount?: number; paidAt?: string };
  /** Staff only: created on the admin side, and how it was booked without an online payment. */
  staff?: { createdBy?: string; offlinePayment?: { note: string; byName?: string; at?: string } };
  /** International: pay before the parcel is weighed. */
  prepay?: { available: boolean; paid: boolean; additionalDue: number };
  terminal: {
    carrierName?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    status?: string;
    bookedAt?: string;
    bookingError?: string;
    shipmentId?: string;
    events: { status: string; description?: string; at: string }[];
  };
  refund?: { pickupFee?: RefundRecord; shipping?: RefundRecord };
  cancelledReason?: string;
  statusHistory: { status: ShipmentStatus; note?: string; byRole: string; byName?: string; at: string }[];
};

export type ShippingConfig = {
  office: {
    name: string;
    phone: string;
    email: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
    lat: number | null;
    lng: number | null;
    openingHours: string;
  };
  pickupAvailable: boolean;
  refundPolicyText: string;
  dutiesNotice: string;
  disclaimerParagraphs: string[];
  maxAutoQuoteKg: number;
};

export type Slide = {
  key: "local" | "international" | "air" | "sea" | "express";
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: string;
  imageUrl: string | null;
  active?: boolean;
};

export type PriceListInfo = {
  id: string;
  monthLabel: string;
  effectiveMonth: string;
  uploadedAt: string;
  downloadUrl: string;
  filename: string;
};

export type SeaFlier = { url: string; downloadUrl: string; contentType: string; filename: string };

export type RateEstimate = {
  manualRequired: boolean;
  billedWeightKg: number;
  fxUpdatedAt: string | null;
  options: { rateId: string; carrierName: string; carrierLogo?: string; deliveryTime?: string; total: number }[];
};

export type ShippingSettings = {
  markupTiers: { minKg: number; maxKg: number; percent: number }[];
  flatFeeNgn: number;
  surchargeNgn: number;
  exchangeRates: Record<string, number>;
  exchangeRatesUpdatedAt: string | null;
  internationalQuoteCurrency: string;
  walletAlertThresholdNgn: number;
  wallet: { balanceNgn: number | null; checkedAt: string | null; error: string | null; low: boolean };
  refundPolicyText: string;
  dutiesNotice: string;
  disclaimerParagraphs: string[];
  office: {
    name: string;
    contactName: string;
    phone: string;
    email: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    country: string;
    zip: string;
    lat: number | null;
    lng: number | null;
    openingHours: string;
  };
  terminal: { configured: boolean; sandbox: boolean };
  maxAutoQuoteKg: number;
};

/** A rate card or other document the Super Admin uploaded (image or PDF). Same shape as the sea flier. */
export type SiteDocument = SeaFlier;

export type CargoPage = {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
  rateCard: SiteDocument | null;
  notes: string[];
};

export type PopupFlyer = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  startsAt: string;
  endsAt: string;
  durationDays: number;
  active: boolean;
  status: "live" | "scheduled" | "expired" | "off";
};

export type BlogCard = { id: string; title: string; slug: string; excerpt: string; coverUrl: string | null; publishedAt: string };
export type BlogPost = BlogCard & { body: string; author: string | null };
export type AdminBlogPost = BlogCard & { body: string; published: boolean; updatedAt: string };
