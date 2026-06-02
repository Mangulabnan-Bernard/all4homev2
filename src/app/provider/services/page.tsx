import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getMyProviderProfile } from "@/features/providers/queries";
import { listCategories } from "@/features/categories/queries";
import { PageHeader } from "@/components/layout/page-header";
import { ServicesManager } from "@/components/providers/services-manager";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Services" };
export const dynamic = "force-dynamic";

export default async function ProviderServicesPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);

  const [profile, categories] = await Promise.all([
    getMyProviderProfile(userId),
    listCategories(),
  ]);

  return (
    <div>
      <PageHeader title="Services" description="The services customers can book from you." />
      {profile ? (
        <ServicesManager services={profile.services} categories={categories} />
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Set up your provider profile before adding services.
          </p>
          <Link href={ROUTES.provider.apply} className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
            Start your application
          </Link>
        </div>
      )}
    </div>
  );
}
