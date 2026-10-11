
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBookingWizard } from "@/components/booking/BookingWizardContext";
import { ProgressSteps } from "@/components/booking/ProgressSteps";
import { LocationsStep } from "@/components/booking/steps/LocationsStep";
import { VehicleStep } from "@/components/booking/steps/VehicleStep";
import { DetailsStep } from "@/components/booking/steps/DetailsStep";
import { ReviewStep } from "@/components/booking/steps/ReviewStep";
import { PaymentStep } from "@/components/booking/steps/PaymentStep";
import { BOOKING_STEPS, type BookingStepKey } from "@/config/booking";
import { LoadingBlock } from "@/components/ui/Feedback";
import type { VehicleDTO } from "@/types";

export type WizardStepProps = {
  goNext: () => void;
  goBack: () => void;
  goTo: (key: BookingStepKey) => void;
  config: { mapBrowserKey: string | null; paystackConfigured: boolean; fallbackVehicles: VehicleDTO[] };
};

export function BookingWizard({
  fallbackVehicles,
  mapBrowserKey,
  paystackConfigured,
}: {
  fallbackVehicles: VehicleDTO[];
  mapBrowserKey: string | null;
  paystackConfigured: boolean;
}) {
  const navigate = useNavigate();
  const { hydrated, draft, quote } = useBookingWizard();
  const [step, setStep] = useState<BookingStepKey>("locations");
  const [maxReached, setMaxReached] = useState<BookingStepKey>("locations");

  const indexOf = (k: BookingStepKey) => BOOKING_STEPS.findIndex((s) => s.key === k);

  const goTo = (key: BookingStepKey) => {
    setStep(key);
    if (indexOf(key) > indexOf(maxReached)) setMaxReached(key);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goNext = () => {
    const next = BOOKING_STEPS[Math.min(indexOf(step) + 1, BOOKING_STEPS.length - 1)];
    goTo(next.key);
  };
  const goBack = () => {
    const prev = BOOKING_STEPS[Math.max(indexOf(step) - 1, 0)];
    goTo(prev.key);
  };

  const completed = useMemo<BookingStepKey[]>(() => {
    const list: BookingStepKey[] = [];
    if (draft.pickup && draft.destination && draft.scheduledDate && draft.scheduledTime)
      list.push("locations");
    if (draft.vehicleSlug && quote) list.push("vehicle");
    if (draft.sender.name && draft.recipient.name && draft.package.description) list.push("details");
    return list;
  }, [draft, quote]);

  const config = { mapBrowserKey, paystackConfigured, fallbackVehicles };
  const stepProps: WizardStepProps = { goNext, goBack, goTo, config };

  return (
    <div className="container-page py-6 md:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold sm:text-2xl">Book a delivery</h1>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="text-sm font-semibold text-muted hover:text-ink"
            >
              Save &amp; exit
            </button>
          </div>
          <ProgressSteps
            current={step}
            completed={[...completed, ...(indexOf(maxReached) >= indexOf(step) ? [] : [])]}
            onJump={(k) => {
              if (indexOf(k) <= indexOf(maxReached)) goTo(k);
            }}
          />
        </div>

        {!hydrated ? (
          <LoadingBlock label="Restoring your booking…" />
        ) : step === "locations" ? (
          <LocationsStep {...stepProps} />
        ) : step === "vehicle" ? (
          <VehicleStep {...stepProps} />
        ) : step === "details" ? (
          <DetailsStep {...stepProps} />
        ) : step === "review" ? (
          <ReviewStep {...stepProps} />
        ) : (
          <PaymentStep {...stepProps} />
        )}
      </div>
    </div>
  );
}
