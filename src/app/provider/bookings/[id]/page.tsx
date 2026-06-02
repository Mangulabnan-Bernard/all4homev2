import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { getBookingById } from "@/features/bookings/queries";
import { BookingDetail } from "@/components/bookings/booking-detail";
import { ROUTES } from "@/constants";

export const metadata: Metadata = { title: "Job" };
export const dynamic = "force-dynamic";

export default async function ProviderBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);

  const booking = await getBookingById(id, { id: userId, role: "PROVIDER" });
  if (!booking) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <BookingDetail booking={booking} role="PROVIDER" backHref={ROUTES.provider.bookings} />
    </div>
  );
}
