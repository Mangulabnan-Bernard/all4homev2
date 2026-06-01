"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Calendar,
  Check,
  CreditCard,
  Loader2,
  MapPin,
  PartyPopper,
  X,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type Status = "idle" | "processing" | "success";

const PAYMENT_METHODS = [
  { value: "SIMULATED_CARD", label: "Card" },
  { value: "SIMULATED_WALLET", label: "Wallet" },
  { value: "SIMULATED_BANK", label: "Bank transfer" },
] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Demo-only transaction number, mirroring the planned TRX-YYYYMMDD-###### format. */
function makeTransactionNumber() {
  const day = todayISO().replace(/-/g, "");
  const seq = Math.floor(100000 + Math.random() * 900000);
  return `TRX-${day}-${seq}`;
}

/**
 * Front-end booking + simulated-payment flow. No backend: submitting fakes a
 * short processing delay, generates a transaction number, and confirms via a
 * toast + success panel. Receives only serializable primitives so it can be
 * dropped into a Server Component.
 */
export function BookingRequestDialog({
  serviceName,
  startingPrice,
  triggerLabel,
  triggerClassName,
}: {
  serviceName: string;
  startingPrice: number;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState<Status>("idle");
  const [txn, setTxn] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [name, setName] = React.useState("");
  const [date, setDate] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [hours, setHours] = React.useState(2);
  const [method, setMethod] = React.useState<PaymentMethod>("SIMULATED_CARD");

  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const total = startingPrice * Math.max(1, hours);

  const close = React.useCallback(() => {
    setOpen(false);
    // Panel is still mounted this tick; defer so focus lands after it unmounts.
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const resetForm = React.useCallback(() => {
    setStatus("idle");
    setTxn(null);
    setErrors({});
    setName("");
    setDate("");
    setAddress("");
    setNotes("");
    setHours(2);
    setMethod("SIMULATED_CARD");
  }, []);

  // Escape to close, Tab focus-trap, and body scroll lock while open.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && status !== "processing") {
        close();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && (active === first || active === panelRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, status, close]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Please enter your name.";
    if (!date) next.date = "Choose a date.";
    else if (date < todayISO()) next.date = "Pick today or a future date.";
    if (!address.trim()) next.address = "We need an address for the visit.";
    setErrors(next);
    return next;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "processing") return;
    const next = validate();
    const firstInvalid = Object.keys(next)[0];
    if (firstInvalid) {
      document.getElementById(`bk-${firstInvalid}`)?.focus();
      return;
    }

    setStatus("processing");
    // Simulate payment + booking creation latency.
    window.setTimeout(() => {
      const transaction = makeTransactionNumber();
      setTxn(transaction);
      setStatus("success");
      toast.success("Booking confirmed!", {
        description: `${serviceName} · ${transaction} · ${formatCurrency(total)} (simulated)`,
      });
    }, 1200);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
        className={cn(buttonVariants({ size: "lg" }), "group", triggerClassName)}
      >
        {triggerLabel ?? `Book ${serviceName}`}
        <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && status !== "processing") close();
          }}
        >
          <div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`Book ${serviceName}`}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-2xl outline-none sm:rounded-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  {status === "success" ? "You're booked" : `Book ${serviceName}`}
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {status === "success"
                    ? "A confirmation has been sent to you."
                    : `from ${formatCurrency(startingPrice)} / hour`}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={status === "processing"}
                aria-label="Close"
                className="grid size-9 place-items-center rounded-full text-[var(--muted-foreground)] transition hover:bg-[var(--accent)] disabled:opacity-50"
              >
                <X className="size-5" />
              </button>
            </div>

            {status === "success" && txn ? (
              <SuccessPanel
                serviceName={serviceName}
                txn={txn}
                total={total}
                method={method}
                date={date}
                onDone={close}
              />
            ) : (
              <form onSubmit={onSubmit} className="space-y-4 p-6">
                <Field label="Your name" htmlFor="bk-name" error={errors.name}>
                  <Input
                    id="bk-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Dela Cruz"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "bk-name-error" : undefined}
                    disabled={status === "processing"}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Preferred date" htmlFor="bk-date" error={errors.date} icon={Calendar}>
                    <Input
                      id="bk-date"
                      type="date"
                      min={todayISO()}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      aria-invalid={Boolean(errors.date)}
                      aria-describedby={errors.date ? "bk-date-error" : undefined}
                      disabled={status === "processing"}
                    />
                  </Field>

                  <Field label="Estimated hours" htmlFor="bk-hours">
                    <Input
                      id="bk-hours"
                      type="number"
                      min={1}
                      max={12}
                      value={hours}
                      onChange={(e) => setHours(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
                      disabled={status === "processing"}
                    />
                  </Field>
                </div>

                <Field label="Service address" htmlFor="bk-address" error={errors.address} icon={MapPin}>
                  <Input
                    id="bk-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Mabini St, Makati"
                    aria-invalid={Boolean(errors.address)}
                    aria-describedby={errors.address ? "bk-address-error" : undefined}
                    disabled={status === "processing"}
                  />
                </Field>

                <Field label="Notes (optional)" htmlFor="bk-notes">
                  <Textarea
                    id="bk-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything the pro should know?"
                    disabled={status === "processing"}
                  />
                </Field>

                <fieldset disabled={status === "processing"}>
                  <legend className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="size-4" />
                    Payment method
                  </legend>
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setMethod(m.value)}
                        aria-pressed={method === m.value}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition",
                          method === m.value
                            ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                            : "border-[var(--border)] hover:bg-[var(--accent)]",
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                    Payments are simulated — no card is charged.
                  </p>
                </fieldset>

                {/* Total + submit */}
                <div className="flex items-center justify-between rounded-xl bg-[var(--accent)] px-4 py-3">
                  <span className="text-sm text-[var(--muted-foreground)]">
                    Estimated total ({Math.max(1, hours)}h)
                  </span>
                  <span className="text-lg font-bold tracking-tight">{formatCurrency(total)}</span>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={status === "processing"}>
                  {status === "processing" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Processing payment…
                    </>
                  ) : (
                    <>Pay &amp; confirm booking</>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function SuccessPanel({
  serviceName,
  txn,
  total,
  method,
  date,
  onDone,
}: {
  serviceName: string;
  txn: string;
  total: number;
  method: PaymentMethod;
  date: string;
  onDone: () => void;
}) {
  const methodLabel = PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
  return (
    <div className="p-6 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-green-100 text-green-700">
        <PartyPopper className="size-7" />
      </div>
      <h3 className="mt-4 text-xl font-bold tracking-tight">Booking confirmed</h3>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Your {serviceName} is scheduled. We&apos;ve emailed your receipt.
      </p>

      <dl className="mt-6 space-y-2 rounded-xl border border-[var(--border)] p-4 text-left text-sm">
        <Row label="Transaction">
          <span className="font-mono">{txn}</span>
        </Row>
        {date && <Row label="Date">{new Date(date).toLocaleDateString()}</Row>}
        <Row label="Payment">{methodLabel} (simulated)</Row>
        <Row label="Amount">
          <span className="font-semibold text-[var(--foreground)]">{formatCurrency(total)}</span>
        </Row>
        <Row label="Status">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            <Check className="size-3" /> Paid
          </span>
        </Row>
      </dl>

      <Button onClick={onDone} size="lg" className="mt-6 w-full">
        Done
      </Button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[var(--muted-foreground)]">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  icon: Icon,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="flex items-center gap-1.5">
        {Icon && <Icon className="size-3.5 text-[var(--muted-foreground)]" />}
        {label}
      </Label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-[var(--destructive)]">
          {error}
        </p>
      )}
    </div>
  );
}
