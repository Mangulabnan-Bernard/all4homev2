import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import type { UserRole } from "@prisma/client";

import type { BookingDetailDTO } from "@/types/dto";
import { BOOKING_STATUS_META, PAYMENT_STATUS_META } from "@/constants";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ReviewForm } from "@/components/reviews/review-form";
import { BookingActions } from "./booking-actions";

const METHOD_LABEL: Record<string, string> = {
  SIMULATED_CARD: "Card",
  SIMULATED_WALLET: "Wallet",
  SIMULATED_BANK: "Bank transfer",
};

export function BookingDetail({
  booking,
  role,
  backHref,
}: {
  booking: BookingDetailDTO;
  role: UserRole;
  backHref: string;
}) {
  const meta = BOOKING_STATUS_META[booking.status];
  const counterpartyLabel = role === "CUSTOMER" ? "Provider" : "Customer";
  const counterpartyName = role === "CUSTOMER" ? booking.providerName : booking.customerName;

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="size-4" />
        Back to bookings
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{booking.serviceTitle}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Booked {formatDateTime(booking.createdAt)}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
            meta.className,
          )}
        >
          {meta.label}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Fact label={counterpartyLabel} value={counterpartyName ?? "—"} />
        <Fact label="Scheduled" value={formatDateTime(booking.scheduledAt)} />
        <Fact label="Address" value={booking.address} />
        <Fact label="Total" value={formatCurrency(booking.totalAmount)} />
      </div>

      {booking.notes && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            Notes
          </p>
          <p className="mt-1 text-sm">{booking.notes}</p>
        </div>
      )}

      {booking.payment && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Payment</h2>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                PAYMENT_STATUS_META[booking.payment.status].className,
              )}
            >
              {PAYMENT_STATUS_META[booking.payment.status].label}
            </span>
          </div>
          <dl className="mt-3 space-y-1.5 text-sm">
            <Row label="Transaction">
              <span className="font-mono">{booking.payment.transactionNumber}</span>
            </Row>
            <Row label="Amount">{formatCurrency(booking.payment.amount)}</Row>
            <Row label="Method">{METHOD_LABEL[booking.payment.method] ?? booking.payment.method}</Row>
          </dl>
        </div>
      )}

      {booking.disputeStatus && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          This booking has a dispute ({booking.disputeStatus.toLowerCase()}). An admin will review
          it.
        </div>
      )}

      {role === "CUSTOMER" &&
        !booking.hasReview &&
        (booking.status === "CONFIRMED" || booking.status === "CLOSED") && (
          <ReviewForm bookingId={booking.id} />
        )}

      <BookingActions bookingId={booking.id} status={booking.status} role={role} />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[var(--muted-foreground)]">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
