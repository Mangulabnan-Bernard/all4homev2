import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getCustomerBookings } from "@/features/bookings/queries";
import { PageHeader } from "@/components/layout/page-header";
import { BookingList } from "@/components/bookings/booking-list";
import { ROUTES } from "@/constants";

export const metadata: Metadata = { title: "My bookings" };
export const dynamic = "force-dynamic";

export default async function CustomerBookingsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);

  const bookings = await getCustomerBookings(userId);

  return (
    <div>
      <PageHeader title="My bookings" description="Everything you've booked, newest first." />
      <BookingList
        items={bookings}
        counterparty="provider"
        hrefFor={(id) => ROUTES.customer.booking(id)}
        emptyMessage="You have no bookings yet."
      />
    </div>
  );
}
