
import { cn } from "@/lib/utils";
import { BOOKING_STEPS, type BookingStepKey } from "@/config/booking";

export function ProgressSteps({
  current,
  completed,
  onJump,
}: {
  current: BookingStepKey;
  completed: BookingStepKey[];
  onJump?: (key: BookingStepKey) => void;
}) {
  const currentIndex = BOOKING_STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="flex items-center gap-1 sm:gap-2">
      {BOOKING_STEPS.map((step, i) => {
        const isDone = completed.includes(step.key) && step.key !== current;
        const isCurrent = step.key === current;
        const reachable = isDone || i <= currentIndex;
        return (
          <li key={step.key} className="flex flex-1 items-center gap-1 sm:gap-2">
            <button
              type="button"
              disabled={!reachable || !onJump}
              onClick={() => reachable && onJump?.(step.key)}
              className={cn(
                "flex items-center gap-2 rounded-sm px-1.5 py-1 text-left transition",
                reachable && onJump ? "cursor-pointer hover:bg-surface" : "cursor-default",
              )}
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-sm border text-xs font-bold transition",
                  isCurrent && "border-ink bg-ink text-paper",
                  isDone && "border-[var(--color-success)] bg-[var(--color-success)] text-paper",
                  !isCurrent && !isDone && "border-line-strong bg-paper text-muted",
                )}
              >
                {isDone ? "✓" : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-semibold sm:block",
                  isCurrent ? "text-ink" : "text-muted",
                )}
              >
                {step.label}
              </span>
            </button>
            {i < BOOKING_STEPS.length - 1 ? (
              <span
                className={cn(
                  "h-px flex-1",
                  i < currentIndex ? "bg-[var(--color-success)]" : "bg-line-strong",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
