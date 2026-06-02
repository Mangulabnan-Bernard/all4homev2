import type { Metadata } from "next";
import { BarChart3, CreditCard, ShieldCheck, Users, CalendarClock } from "lucide-react";

import { getAnalytics } from "@/features/admin/queries";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { BOOKING_STATUS_META } from "@/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const a = await getAnalytics();
  const totalByStatus = a.bookingsByStatus.reduce((sum, r) => sum + r.count, 0);

  return (
    <div>
      <PageHeader title="Analytics" description="Platform metrics at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total users" value={a.totalUsers} icon={Users} />
        <StatCard
          label="Approved providers"
          value={a.totalProviders}
          icon={ShieldCheck}
          accent="bg-green-100 text-green-700"
        />
        <StatCard
          label="Pending approvals"
          value={a.pendingProviders}
          icon={ShieldCheck}
          accent="bg-amber-100 text-amber-700"
        />
        <StatCard
          label="Total bookings"
          value={a.totalBookings}
          icon={CalendarClock}
          accent="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="Revenue"
          value={formatCurrency(a.totalRevenue)}
          icon={CreditCard}
          accent="bg-teal-100 text-teal-700"
        />
      </div>

      <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-[var(--muted-foreground)]" />
          <h2 className="text-lg font-semibold tracking-tight">Bookings by status</h2>
        </div>
        {totalByStatus === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">No bookings yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {a.bookingsByStatus.map((row) => {
              const meta = BOOKING_STATUS_META[row.status];
              const pct = Math.round((row.count / totalByStatus) * 100);
              return (
                <li key={row.status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        meta.className,
                      )}
                    >
                      {meta.label}
                    </span>
                    <span className="tabular-nums text-[var(--muted-foreground)]">
                      {row.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--accent)]">
                    <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
