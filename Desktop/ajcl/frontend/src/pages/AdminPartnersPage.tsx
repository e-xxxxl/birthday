import { useState } from "react";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Alert, EmptyState, LoadingBlock } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http, HttpError } from "@/lib/http";
import { cn, formatNaira } from "@/lib/utils";
import type { PartnerAccountDTO } from "@/types";

const empty = {
  email: "",
  company: "",
  markupPercent: "",
  creditLimit: "",
  firstName: "",
  lastName: "",
  phone: "",
  password: "",
};

/** The numbers an admin types are strings; blank means "not set". */
export function toNumber(v: string): number | undefined {
  const t = v.trim();
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

export function AdminPartnersPage() {
  useDocumentTitle("Partners");
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(
    () => http.get<{ partners: PartnerAccountDTO[] }>("/api/admin/partners"),
    [],
  );

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const body: Record<string, unknown> = {
        email: form.email,
        company: form.company || undefined,
        markupPercent: toNumber(form.markupPercent),
        creditLimit: toNumber(form.creditLimit),
      };
      if (mode === "new") Object.assign(body, { firstName: form.firstName, lastName: form.lastName, phone: form.phone, password: form.password });
      const res = await http.post<{ converted: boolean }>("/api/admin/partners", body);
      toast.success(
        res.converted ? "Customer is now a partner" : "Partner account created",
        res.converted ? `${form.email} will see partner pricing and be billed on account.` : `${form.email} can sign in with the temporary password.`,
      );
      setForm(empty);
      reload();
    } catch (err) {
      setFormError(err instanceof HttpError ? err.message : "Could not save the partner.");
    } finally {
      setSaving(false);
    }
  }

  const partners = data?.partners ?? [];
  const owed = partners.reduce((s, p) => s + p.outstanding, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Partners</h1>
        <p className="mt-1 text-sm text-muted">
          Partners book normally but are billed on account instead of paying in the app. You set each
          partner&apos;s price markup and record the payments they make.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {[
          { label: "Partners", value: String(partners.filter((p) => p.active).length) },
          { label: "Total owed", value: formatNaira(owed), owing: owed > 0 },
          { label: "Orders on account", value: String(partners.reduce((s, p) => s + p.orderCount, 0)) },
        ].map((c) => (
          <div key={c.label} className="min-w-0 rounded-2xl border border-line bg-paper p-4 shadow-card sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted sm:text-xs">{c.label}</p>
            <p className={cn("mt-1.5 text-2xl font-bold tabular-nums", c.owing && "text-[var(--color-warning)]")}>{c.value}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader title="Add a partner" />
        <CardBody>
          <div className="mb-4 inline-flex rounded-full border border-line-strong p-0.5 text-sm font-semibold">
            {(
              [
                ["existing", "Existing customer"],
                ["new", "New account"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setMode(k)}
                className={cn("rounded-full px-4 py-1.5 transition", mode === k ? "bg-ink text-paper" : "text-ink-soft hover:text-ink")}
              >
                {label}
              </button>
            ))}
          </div>

          {formError ? <Alert tone="danger" className="mb-4">{formError}</Alert> : null}
          <form onSubmit={create} className="space-y-4" noValidate>
            <Input
              label={mode === "existing" ? "Customer's email" : "Email"}
              type="email"
              required
              autoComplete="off"
              value={form.email}
              onChange={set("email")}
              hint={mode === "existing" ? "They must already have a customer account." : undefined}
            />
            {mode === "new" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="First name" required value={form.firstName} onChange={set("firstName")} />
                  <Input label="Last name" required value={form.lastName} onChange={set("lastName")} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Phone" type="tel" required value={form.phone} onChange={set("phone")} />
                  <PasswordInput
                    label="Temporary password"
                    required
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    hint="8+ characters with an uppercase letter and a number."
                  />
                </div>
              </>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Company (optional)" value={form.company} onChange={set("company")} />
              <Input
                label="Price markup (%)"
                type="number"
                inputMode="decimal"
                step="0.5"
                placeholder="0"
                value={form.markupPercent}
                onChange={set("markupPercent")}
                hint="Added to every fare they're quoted. Use a negative number for a discount."
              />
              <Input
                label="Credit limit (₦)"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="No limit"
                value={form.creditLimit}
                onChange={set("creditLimit")}
                hint="The most they can owe at once. Blank means no limit."
              />
            </div>
            <Button type="submit" loading={saving}>
              {mode === "existing" ? "Make partner" : "Create partner"}
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="All partners" description={`${partners.length} account${partners.length === 1 ? "" : "s"}`} />
        <CardBody className="p-0">
          {loading && !data ? (
            <LoadingBlock />
          ) : error ? (
            <div className="p-5">
              <Alert tone="danger">
                {error}{" "}
                <button type="button" onClick={reload} className="font-semibold underline">
                  Retry
                </button>
              </Alert>
            </div>
          ) : partners.length === 0 ? (
            <EmptyState title="No partners yet" description="Add your first partner above." />
          ) : (
            <ul className="divide-y divide-line">
              {partners.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/partners/${p.id}`}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4 transition hover:bg-surface"
                  >
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-semibold">
                        {p.company || p.fullName}
                        {!p.active ? (
                          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                            Inactive
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted">
                        {p.company ? `${p.fullName} · ` : ""}
                        {p.email} · markup {p.markupPercent > 0 ? "+" : ""}
                        {p.markupPercent}%{p.creditLimit ? ` · limit ${formatNaira(p.creditLimit)}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-bold tabular-nums", p.outstanding > 0 && "text-[var(--color-warning)]")}>
                        {p.outstanding > 0 ? `${formatNaira(p.outstanding)} owed` : "Settled"}
                      </p>
                      <p className="text-xs text-muted">
                        {p.orderCount} order{p.orderCount === 1 ? "" : "s"} · {formatNaira(p.paid)} paid
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
