import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getProviderBookings } from "@/features/bookings/queries";
import { PageHeader } from "@/components/layout/page-header";
import { BookingList } from "@/components/bookings/booking-list";
import { ROUTES } from "@/constants";

export const metadata: Metadata = { title: "Jobs" };
export const dynamic = "force-dynamic";

export default async function ProviderBookingsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);

  const bookings = await getProviderBookings(userId);

  return (
    <div>
      <PageHeader title="Jobs" description="Bookings assigned to you, newest first." />
      <BookingList
        items={bookings}
        counterparty="customer"
        hrefFor={(id) => ROUTES.provider.booking(id)}
        emptyMessage="You have no jobs yet."
      />
    </div>
  );
}
