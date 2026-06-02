import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CreditCard,
  Gavel,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { getAnalytics } from "@/features/admin/queries";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { BOOKING_STATUS_META, ROUTES } from "@/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const a = await getAnalytics();

  return (
    <div>
      <PageHeader title="Admin dashboard" description="Platform overview and operations." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total users" value={a.totalUsers} icon={Users} />
        <StatCard
          label="Providers"
          value={a.totalProviders}
          icon={ShieldCheck}
          accent="bg-green-100 text-green-700"
          hint="Approved"
        />
        <StatCard
          label="Pending approvals"
          value={a.pendingProviders}
          icon={ShieldCheck}
          accent="bg-amber-100 text-amber-700"
        />
        <StatCard
          label="Bookings"
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

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold tracking-tight">Bookings by status</h2>
          {a.bookingsByStatus.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">No bookings yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {a.bookingsByStatus.map((row) => {
                const meta = BOOKING_STATUS_META[row.status];
                return (
                  <li key={row.status} className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        meta.className,
                      )}
                    >
                      {meta.label}
                    </span>
                    <span className="font-semibold tabular-nums">{row.count}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold tracking-tight">Operations</h2>
          <div className="mt-4 space-y-2">
            <QuickLink
              href={ROUTES.admin.providers}
              icon={ShieldCheck}
              label="Review provider approvals"
              badge={a.pendingProviders || undefined}
            />
            <QuickLink href={ROUTES.admin.users} icon={Users} label="Manage users" />
            <QuickLink href={ROUTES.admin.disputes} icon={Gavel} label="Resolve disputes" />
            <QuickLink href={ROUTES.admin.analytics} icon={BarChart3} label="View analytics" />
          </div>
        </section>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  badge,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 transition hover:border-[var(--primary)]/40 hover:bg-[var(--accent)]"
    >
      <Icon className="size-5 text-[var(--muted-foreground)]" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {badge ? (
        <span className="rounded-full bg-[var(--destructive)] px-2 py-0.5 text-xs font-semibold text-[var(--destructive-foreground)]">
          {badge}
        </span>
      ) : null}
      <ArrowRight className="size-4 text-[var(--muted-foreground)]" />
    </Link>
  );
}
