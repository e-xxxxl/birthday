
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LocationDTO, QuoteDTO, VehicleDTO } from "@/types";
import type { DeliveryType } from "@/config/booking";
import { PACKAGE_CATEGORIES } from "@/config/booking";
import type { ClientRoute } from "@/lib/maps/client";

export type ContactForm = { name: string; phone: string; email: string };
export type PackageForm = {
  description: string;
  category: (typeof PACKAGE_CATEGORIES)[number];
  quantity: number;
  declaredValue: number;
  specialInstructions: string;
};

export type BookingDraft = {
  pickup: LocationDTO | null;
  stops: LocationDTO[];
  destination: LocationDTO | null;
  deliveryType: DeliveryType;
  scheduledDate: string;
  scheduledTime: string;
  vehicleSlug: string | null;
  sender: ContactForm;
  recipient: ContactForm;
  package: PackageForm;
  notes: string;
};

const emptyContact: ContactForm = { name: "", phone: "", email: "" };

const emptyDraft: BookingDraft = {
  pickup: null,
  stops: [],
  destination: null,
  deliveryType: "single",
  scheduledDate: "",
  scheduledTime: "",
  vehicleSlug: null,
  sender: { ...emptyContact },
  recipient: { ...emptyContact },
  package: {
    description: "",
    category: "Documents",
    quantity: 1,
    declaredValue: 0,
    specialInstructions: "",
  },
  notes: "",
};

const STORAGE_KEY = "ajc:booking-draft:v1";

type WizardValue = {
  draft: BookingDraft;
  update: (patch: Partial<BookingDraft>) => void;
  reset: () => void;
  quote: QuoteDTO | null;
  setQuote: (q: QuoteDTO | null) => void;
  /** Route measured in the browser (DirectionsService) — passed to the server. */
  clientRoute: ClientRoute | null;
  setClientRoute: (r: ClientRoute | null) => void;
  selectedVehicle: VehicleDTO | null;
  hydrated: boolean;
};

const WizardContext = createContext<WizardValue | null>(null);

export function BookingWizardProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<BookingDraft>(emptyDraft);
  const [quote, setQuote] = useState<QuoteDTO | null>(null);
  const [clientRoute, setClientRoute] = useState<ClientRoute | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted draft once.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<BookingDraft>;
        setDraft({ ...emptyDraft, ...parsed, sender: { ...emptyContact, ...parsed.sender }, recipient: { ...emptyContact, ...parsed.recipient }, package: { ...emptyDraft.package, ...parsed.package } });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Persist on change.
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft, hydrated]);

  const update = useCallback((patch: Partial<BookingDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setDraft(emptyDraft);
    setQuote(null);
    setClientRoute(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const selectedVehicle = useMemo(() => {
    if (!quote || !draft.vehicleSlug) return null;
    return quote.vehicles.find((v) => v.vehicle.slug === draft.vehicleSlug)?.vehicle ?? null;
  }, [quote, draft.vehicleSlug]);

  const value = useMemo<WizardValue>(
    () => ({
      draft,
      update,
      reset,
      quote,
      setQuote,
      clientRoute,
      setClientRoute,
      selectedVehicle,
      hydrated,
    }),
    [draft, update, reset, quote, clientRoute, selectedVehicle, hydrated],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useBookingWizard(): WizardValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useBookingWizard must be used within <BookingWizardProvider>");
  return ctx;
}
