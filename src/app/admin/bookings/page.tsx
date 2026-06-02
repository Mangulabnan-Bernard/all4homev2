import type { Metadata } from "next";

import { getAllBookings } from "@/features/admin/queries";
import { PageHeader } from "@/components/layout/page-header";
import { BookingList } from "@/components/bookings/booking-list";

export const metadata: Metadata = { title: "Bookings" };
export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const bookings = await getAllBookings();

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="The 100 most recent bookings across the platform."
      />
      <BookingList items={bookings} counterparty="both" emptyMessage="No bookings yet." />
    </div>
  );
}
