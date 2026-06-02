import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getFavoriteProviders } from "@/features/providers/queries";
import { PageHeader } from "@/components/layout/page-header";
import { ProviderCard } from "@/components/providers/provider-card";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Favorites" };
export const dynamic = "force-dynamic";

export default async function CustomerFavoritesPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);

  const favorites = await getFavoriteProviders(userId);

  return (
    <div>
      <PageHeader title="Favorites" description="Providers you've saved." />
      {favorites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            No favorites yet. Tap the heart on a provider to save them here.
          </p>
          <Link href={ROUTES.customer.search} className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
            Find a pro
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((p) => (
            <ProviderCard key={p.id} provider={p} favorited />
          ))}
        </div>
      )}
    </div>
  );
}
