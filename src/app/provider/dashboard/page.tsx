import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarCheck, Clock, ShieldAlert, Star, Wallet, Wrench } from "lucide-react";
import type { BookingStatus } from "@prisma/client";

import { auth } from "@/auth";
import { getProviderBookings } from "@/features/bookings/queries";
import { getMyProviderProfile } from "@/features/providers/queries";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { buttonVariants } from "@/components/ui/button";
import {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_STATUS_META,
  ROUTES,
  VERIFICATION_STATUS_META,
} from "@/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Provider dashboard" };
export const dynamic = "force-dynamic";

const EARNING_STATUSES: BookingStatus[] = ["COMPLETED", "CONFIRMED", "CLOSED"];

export default async function ProviderDashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);

  const profile = await getMyProviderProfile(userId);

  // A PROVIDER who hasn't applied yet has no ProviderProfile — funnel them in.
  if (!profile) {
    return (
      <div>
        <PageHeader
          title="Provider dashboard"
          description="Set up your provider profile to start receiving bookings."
        />
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
          <h2 className="text-lg font-semibold tracking-tight">Finish your application</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-[var(--muted-foreground)]">
            You haven&apos;t set up a provider profile yet. Complete your application to list
            services and accept bookings.
          </p>
          <Link href={ROUTES.provider.apply} className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
            Start application
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  const bookings = await getProviderBookings(userId);
  const active = bookings.filter((b) => ACTIVE_BOOKING_STATUSES.includes(b.status)).length;
  const earningBookings = bookings.filter((b) => EARNING_STATUSES.includes(b.status));
  const earnings = earningBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const activeServices = profile.services.filter((s) => s.isActive).length;
  const recent = bookings.slice(0, 5);
  const vmeta = VERIFICATION_STATUS_META[profile.verificationStatus];

  return (
    <div>
      <PageHeader
        title="Provider dashboard"
        description="Manage your jobs, services, and earnings."
        action={
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
              vmeta.className,
            )}
          >
            {vmeta.label}
          </span>
        }
      />

      {profile.verificationStatus !== "APPROVED" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" />
          <p className="text-sm">
            Your profile is <strong>{vmeta.label.toLowerCase()}</strong>. You won&apos;t appear in
            search or receive new bookings until an admin approves your account.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active jobs" value={active} icon={Clock} accent="bg-blue-100 text-blue-700" />
        <StatCard
          label="Completed"
          value={earningBookings.length}
          icon={CalendarCheck}
          accent="bg-green-100 text-green-700"
        />
        <StatCard
          label="Earnings"
          value={formatCurrency(earnings)}
          icon={Wallet}
          accent="bg-amber-100 text-amber-700"
          hint="From completed jobs"
        />
        <StatCard
          label="Rating"
          value={profile.reviewCount > 0 ? profile.averageRating.toFixed(1) : "—"}
          icon={Star}
          accent="bg-yellow-100 text-yellow-700"
          hint={`${profile.reviewCount} review${profile.reviewCount === 1 ? "" : "s"}`}
        />
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recent jobs</h2>
          <Link
            href={ROUTES.provider.bookings}
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
          >
            View all
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">No jobs yet.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link
                href={ROUTES.provider.services}
                className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              >
                <Wrench className="size-4" />
                Manage services
              </Link>
              <Link
                href={ROUTES.provider.availability}
                className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              >
                <Clock className="size-4" />
                Set availability
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.map((b) => (
              <li key={b.id}>
                <Link
                  href={ROUTES.provider.booking(b.id)}
                  className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--primary)]/40 hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{b.serviceTitle}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {b.customerName ?? "Customer"} · {formatDate(b.scheduledAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-semibold">{formatCurrency(b.totalAmount)}</span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        BOOKING_STATUS_META[b.status].className,
                      )}
                    >
                      {BOOKING_STATUS_META[b.status].label}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <ManageLink href={ROUTES.provider.services} icon={Wrench} label="Services" hint={`${activeServices} active`} />
        <ManageLink href={ROUTES.provider.availability} icon={Clock} label="Availability" hint="Set your hours" />
        <ManageLink href={ROUTES.provider.earnings} icon={Wallet} label="Earnings" hint="View payouts" />
      </section>
    </div>
  );
}

function ManageLink({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: typeof Wrench;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--primary)]/40 hover:shadow-sm"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent)]">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-[var(--muted-foreground)]">{hint}</span>
      </span>
      <ArrowRight className="ml-auto size-4 text-[var(--muted-foreground)]" />
    </Link>
  );
}
