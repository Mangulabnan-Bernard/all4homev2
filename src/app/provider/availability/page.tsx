import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getMyProviderProfile, getMyAvailability } from "@/features/providers/queries";
import { PageHeader } from "@/components/layout/page-header";
import { AvailabilityEditor } from "@/components/providers/availability-editor";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Availability" };
export const dynamic = "force-dynamic";

export default async function ProviderAvailabilityPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);

  const [profile, slots] = await Promise.all([
    getMyProviderProfile(userId),
    getMyAvailability(userId),
  ]);

  return (
    <div>
      <PageHeader title="Availability" description="The weekly hours you're available to work." />
      {profile ? (
        <AvailabilityEditor initialSlots={slots} />
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Set up your provider profile before setting availability.
          </p>
          <Link href={ROUTES.provider.apply} className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
            Start your application
          </Link>
        </div>
      )}
    </div>
  );
}
