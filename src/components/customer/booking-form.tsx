"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react";

import { createBookingAction } from "@/actions/bookings/create-booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const METHODS = [
  { value: "SIMULATED_CARD", label: "Card" },
  { value: "SIMULATED_WALLET", label: "Wallet" },
  { value: "SIMULATED_BANK", label: "Bank transfer" },
] as const;
type Method = (typeof METHODS)[number]["value"];

export function BookingForm({
  serviceId,
  providerId,
  price,
}: {
  serviceId: string;
  providerId: string;
  price: number;
}) {
  const router = useRouter();
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [hours, setHours] = React.useState(2);
  const [address, setAddress] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [method, setMethod] = React.useState<Method>("SIMULATED_CARD");
  const [submitting, setSubmitting] = React.useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const total = price * Math.max(1, hours);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) {
      toast.error("Pick a date and time.");
      return;
    }
    if (address.trim().length < 5) {
      toast.error("Enter a service address.");
      return;
    }
    const scheduledAt = new Date(`${date}T${time}:00`);
    if (scheduledAt.getTime() <= Date.now()) {
      toast.error("Pick a time in the future.");
      return;
    }

    setSubmitting(true);
    const res = await createBookingAction({
      serviceId,
      providerId,
      scheduledAt: scheduledAt.toISOString(),
      address: address.trim(),
      notes: notes.trim() || undefined,
      hours,
      paymentMethod: method,
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Booking confirmed!");
    router.push(ROUTES.customer.booking(res.data.bookingId));
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="time">Time</Label>
          <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="hours">Estimated hours</Label>
        <Input
          id="hours"
          type="number"
          min={1}
          max={12}
          value={hours}
          onChange={(e) => setHours(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Service address</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Mabini St, Makati"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything the pro should know?"
        />
      </div>

      <fieldset>
        <legend className="mb-2 flex items-center gap-2 text-sm font-medium">
          <CreditCard className="size-4" />
          Payment method
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => (
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

      <div className="flex items-center justify-between rounded-xl bg-[var(--accent)] px-4 py-3">
        <span className="text-sm text-[var(--muted-foreground)]">
          Estimated total ({Math.max(1, hours)}h)
        </span>
        <span className="text-lg font-bold tracking-tight">{formatCurrency(total)}</span>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Pay &amp; confirm booking
      </Button>
    </form>
  );
}
