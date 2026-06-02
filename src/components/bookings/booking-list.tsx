import Link from "next/link";
import type { BookingListItemDTO } from "@/types/dto";
import { BOOKING_STATUS_META } from "@/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Shared read-only booking list. `counterparty` controls which name is shown
 * (the customer sees the provider, the provider sees the customer, admin sees
 * both). Pass `hrefFor` to make rows link to a detail page.
 */
export function BookingList({
  items,
  counterparty,
  hrefFor,
  emptyMessage = "No bookings yet.",
}: {
  items: BookingListItemDTO[];
  counterparty: "provider" | "customer" | "both";
  hrefFor?: (id: string) => string;
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((b) => {
        const meta = BOOKING_STATUS_META[b.status];
        const who =
          counterparty === "provider"
            ? (b.providerName ?? "Provider")
            : counterparty === "customer"
              ? (b.customerName ?? "Customer")
              : `${b.customerName ?? "Customer"} · ${b.providerName ?? "Provider"}`;

        const inner = (
          <div
            className={cn(
              "flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4",
              hrefFor && "transition hover:border-[var(--primary)]/40 hover:shadow-sm",
            )}
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{b.serviceTitle}</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {who} · {formatDate(b.scheduledAt)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="font-semibold">{formatCurrency(b.totalAmount)}</span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  meta.className,
                )}
              >
                {meta.label}
              </span>
            </div>
          </div>
        );

        return <li key={b.id}>{hrefFor ? <Link href={hrefFor(b.id)}>{inner}</Link> : inner}</li>;
      })}
    </ul>
  );
}
