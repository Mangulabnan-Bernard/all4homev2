import type { Metadata } from "next";
import type { DisputeStatus } from "@prisma/client";

import { getDisputes } from "@/features/disputes/queries";
import { PageHeader } from "@/components/layout/page-header";
import { DisputeActions } from "@/components/admin/dispute-actions";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Disputes" };
export const dynamic = "force-dynamic";

const STATUS_META: Record<DisputeStatus, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-amber-100 text-amber-800" },
  UNDER_REVIEW: { label: "Under review", className: "bg-blue-100 text-blue-800" },
  RESOLVED: { label: "Resolved", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
  CLOSED: { label: "Closed", className: "bg-gray-100 text-gray-700" },
};

export default async function AdminDisputesPage() {
  const disputes = await getDisputes();

  return (
    <div>
      <PageHeader title="Disputes" description="Raised by customers and providers, newest first." />

      {disputes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">No disputes.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {disputes.map((d) => {
            const meta = STATUS_META[d.status];
            return (
              <li
                key={d.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          meta.className,
                        )}
                      >
                        {meta.label}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        Booking {d.bookingId.slice(0, 8)} · {formatDate(d.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{d.reason}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Raised by {d.raisedByName ?? "a user"}
                    </p>
                    {d.resolution && (
                      <p className="mt-2 rounded-lg bg-[var(--accent)] p-2 text-xs">
                        Resolution: {d.resolution}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <DisputeActions disputeId={d.id} status={d.status} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
