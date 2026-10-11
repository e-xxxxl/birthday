
import { useState } from "react";
import { useBookingWizard, type ContactForm } from "@/components/booking/BookingWizardContext";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { QuantityField } from "@/components/ui/QuantityField";
import { Alert } from "@/components/ui/Feedback";
import { PACKAGE_CATEGORIES } from "@/config/booking";
import type { WizardStepProps } from "@/components/booking/BookingWizard";

const phoneOk = (v: string) => /^[+]?[0-9()\s-]{7,20}$/.test(v.trim());

export function DetailsStep({ goNext, goBack }: WizardStepProps) {
  const { draft, update } = useBookingWizard();
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setContact = (which: "sender" | "recipient", patch: Partial<ContactForm>) =>
    update({ [which]: { ...draft[which], ...patch } });

  function prefillSender() {
    if (!user) return;
    update({
      sender: { name: user.fullName, phone: user.phone || draft.sender.phone, email: user.email },
    });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (draft.sender.name.trim().length < 2) e["sender.name"] = "Required";
    if (!phoneOk(draft.sender.phone)) e["sender.phone"] = "Enter a valid phone number";
    if (draft.recipient.name.trim().length < 2) e["recipient.name"] = "Required";
    if (!phoneOk(draft.recipient.phone)) e["recipient.phone"] = "Enter a valid phone number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.recipient.email.trim())) {
      e["recipient.email"] = "Enter the recipient's email address";
    }
    if (draft.package.description.trim().length < 3) e["package.description"] = "Describe the package";
    if (draft.package.quantity < 1) e["package.quantity"] = "At least 1";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Sender</h2>
            {user ? (
              <button
                type="button"
                onClick={prefillSender}
                className="text-xs font-semibold text-ink-soft hover:text-ink"
              >
                Use my details
              </button>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Sender name"
              required
              value={draft.sender.name}
              onChange={(e) => setContact("sender", { name: e.target.value })}
              error={errors["sender.name"]}
            />
            <Input
              label="Sender phone"
              type="tel"
              required
              value={draft.sender.phone}
              onChange={(e) => setContact("sender", { phone: e.target.value })}
              error={errors["sender.phone"]}
            />
          </div>
          <Input
            label="Sender email (optional)"
            type="email"
            value={draft.sender.email}
            onChange={(e) => setContact("sender", { email: e.target.value })}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Recipient</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Recipient name"
              required
              value={draft.recipient.name}
              onChange={(e) => setContact("recipient", { name: e.target.value })}
              error={errors["recipient.name"]}
            />
            <Input
              label="Recipient phone"
              type="tel"
              required
              value={draft.recipient.phone}
              onChange={(e) => setContact("recipient", { phone: e.target.value })}
              error={errors["recipient.phone"]}
            />
          </div>
          <Input
            label="Recipient email"
            type="email"
            required
            autoComplete="off"
            value={draft.recipient.email}
            onChange={(e) => setContact("recipient", { email: e.target.value })}
            error={errors["recipient.email"]}
            hint="We email the recipient their delivery code and a tracking link once payment is confirmed."
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Package</h2>
          <Input
            label="What are you sending?"
            required
            placeholder="e.g. Sealed documents, phone accessories"
            value={draft.package.description}
            onChange={(e) => update({ package: { ...draft.package, description: e.target.value } })}
            error={errors["package.description"]}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Category"
              value={draft.package.category}
              onChange={(e) =>
                update({
                  package: {
                    ...draft.package,
                    category: e.target.value as (typeof PACKAGE_CATEGORIES)[number],
                  },
                })
              }
            >
              {PACKAGE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <QuantityField
              label="Quantity"
              min={1}
              max={999}
              value={draft.package.quantity}
              onChange={(quantity) => update({ package: { ...draft.package, quantity } })}
              error={errors["package.quantity"]}
            />
            <Input
              label="Declared value (₦)"
              type="number"
              min={0}
              value={draft.package.declaredValue || ""}
              onChange={(e) =>
                update({
                  package: { ...draft.package, declaredValue: Math.max(0, Number(e.target.value) || 0) },
                })
              }
              hint="For reference only"
            />
          </div>
          <Textarea
            label="Special instructions (optional)"
            placeholder="Fragile, keep upright, call on arrival…"
            value={draft.package.specialInstructions}
            onChange={(e) =>
              update({ package: { ...draft.package, specialInstructions: e.target.value } })
            }
          />
          <Textarea
            label="Notes for the rider (optional)"
            value={draft.notes}
            onChange={(e) => update({ notes: e.target.value })}
          />
        </CardBody>
      </Card>

      {Object.keys(errors).length > 0 ? (
        <Alert tone="danger">Please fix the highlighted fields.</Alert>
      ) : null}

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={goBack}>
          Back
        </Button>
        <Button
          size="lg"
          onClick={() => {
            if (validate()) goNext();
          }}
        >
          Review booking
        </Button>
      </div>
    </div>
  );
}
