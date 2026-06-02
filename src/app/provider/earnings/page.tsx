import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarCheck, TrendingUp, Wallet } from "lucide-react";
import type { BookingStatus } from "@prisma/client";

import { auth } from "@/auth";
import { getProviderBookings } from "@/features/bookings/queries";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { BookingList } from "@/components/bookings/booking-list";
import { ROUTES } from "@/constants";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Earnings" };
export const dynamic = "force-dynamic";

const EARNING_STATUSES: BookingStatus[] = ["COMPLETED", "CONFIRMED", "CLOSED"];

export default async function ProviderEarningsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);

  const bookings = await getProviderBookings(userId);
  const earning = bookings.filter((b) => EARNING_STATUSES.includes(b.status));
  const total = earning.reduce((sum, b) => sum + b.totalAmount, 0);
  const avg = earning.length ? total / earning.length : 0;

  return (
    <div>
      <PageHeader title="Earnings" description="Income from completed and confirmed jobs." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total earned"
          value={formatCurrency(total)}
          icon={Wallet}
          accent="bg-amber-100 text-amber-700"
        />
        <StatCard
          label="Paid jobs"
          value={earning.length}
          icon={CalendarCheck}
          accent="bg-green-100 text-green-700"
        />
        <StatCard label="Avg / job" value={formatCurrency(avg)} icon={TrendingUp} />
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold tracking-tight">Earning jobs</h2>
      <BookingList
        items={earning}
        counterparty="customer"
        hrefFor={(id) => ROUTES.provider.booking(id)}
        emptyMessage="No earnings yet — completed jobs will show here."
      />
    </div>
  );
}
