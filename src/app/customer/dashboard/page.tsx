import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarCheck, CalendarClock, Clock, Search, Wallet } from "lucide-react";
import type { BookingStatus } from "@prisma/client";

import { auth } from "@/auth";
import { getCustomerBookings } from "@/features/bookings/queries";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { ACTIVE_BOOKING_STATUSES, BOOKING_STATUS_META, ROUTES } from "@/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const COMPLETED_STATUSES: BookingStatus[] = ["COMPLETED", "CONFIRMED", "CLOSED"];

export default async function CustomerDashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);
  const firstName = session?.user?.name?.split(" ")[0] ?? null;

  const bookings = await getCustomerBookings(userId);
  const active = bookings.filter((b) => ACTIVE_BOOKING_STATUSES.includes(b.status)).length;
  const completed = bookings.filter((b) => COMPLETED_STATUSES.includes(b.status)).length;
  const totalSpent = bookings
    .filter((b) => b.status !== "CANCELED")
    .reduce((sum, b) => sum + b.totalAmount, 0);
  const recent = bookings.slice(0, 5);

  return (
    <div>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        description="Track your bookings and find trusted home pros."
        action={
          <Link href={ROUTES.customer.search} className={cn(buttonVariants({ size: "sm" }))}>
            <Search className="size-4" />
            Find a pro
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total bookings" value={bookings.length} icon={CalendarClock} />
        <StatCard label="Active" value={active} icon={Clock} accent="bg-blue-100 text-blue-700" />
        <StatCard
          label="Completed"
          value={completed}
          icon={CalendarCheck}
          accent="bg-green-100 text-green-700"
        />
        <StatCard
          label="Total spent"
          value={formatCurrency(totalSpent)}
          icon={Wallet}
          accent="bg-amber-100 text-amber-700"
        />
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recent bookings</h2>
          <Link
            href={ROUTES.customer.bookings}
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
          >
            View all
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">You have no bookings yet.</p>
            <Link
              href={ROUTES.customer.search}
              className={cn(buttonVariants({ size: "sm" }), "mt-4")}
            >
              <Search className="size-4" />
              Find a pro
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.map((b) => (
              <li key={b.id}>
                <Link
                  href={ROUTES.customer.booking(b.id)}
                  className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--primary)]/40 hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{b.serviceTitle}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {b.providerName ?? "Provider"} · {formatDate(b.scheduledAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-semibold">{formatCurrency(b.totalAmount)}</span>
                    <StatusBadge status={b.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const meta = BOOKING_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}
