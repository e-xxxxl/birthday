
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Field";

/** Returns YYYY-MM-DD for the local "today". */
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** HH:mm 30 minutes from now. */
function leadTimeStr(): string {
  const d = new Date(Date.now() + 30 * 60 * 1000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function DeliveryScheduler({
  date,
  time,
  onChange,
  errors,
}: {
  date: string;
  time: string;
  onChange: (patch: { scheduledDate?: string; scheduledTime?: string }) => void;
  errors?: { date?: string; time?: string };
}) {
  // Resolve "now"-dependent bounds after mount so render stays pure.
  const [min, setMin] = useState("");
  const [lead, setLead] = useState("");
  useEffect(() => {
    setMin(todayStr());
    setLead(leadTimeStr());
    const t = setInterval(() => setLead(leadTimeStr()), 60_000);
    return () => clearInterval(t);
  }, []);

  const minTime = date && date === min ? lead : undefined;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label="Delivery date"
        type="date"
        required
        min={min}
        value={date}
        onChange={(e) => onChange({ scheduledDate: e.target.value })}
        error={errors?.date}
      />
      <Input
        label="Delivery time"
        type="time"
        required
        min={minTime}
        value={time}
        onChange={(e) => onChange({ scheduledTime: e.target.value })}
        error={errors?.time}
        hint={minTime ? "At least 30 minutes from now" : undefined}
      />
    </div>
  );
}
