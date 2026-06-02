import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { getServiceForBooking } from "@/features/providers/queries";
import { BookingForm } from "@/components/customer/booking-form";
import { ROUTES } from "@/constants";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Book a service" };
export const dynamic = "force-dynamic";

export default async function CustomerBookPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);

  const svc = await getServiceForBooking(serviceId);
  if (!svc) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={ROUTES.customer.provider(svc.providerId)}
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="size-4" />
        Back to provider
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">Book {svc.title}</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        with {svc.providerName ?? "your provider"} · from {formatCurrency(svc.price)} / hour
      </p>

      <div className="mt-6">
        <BookingForm serviceId={svc.id} providerId={svc.providerId} price={svc.price} />
      </div>
    </div>
  );
}
