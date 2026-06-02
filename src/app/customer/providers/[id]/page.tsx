import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { getProviderById, getFavoriteProviderIds } from "@/features/providers/queries";
import { Stars } from "@/components/reviews/stars";
import { FavoriteButton } from "@/components/providers/favorite-button";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Provider" };
export const dynamic = "force-dynamic";

export default async function CustomerProviderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);

  const provider = await getProviderById(id);
  if (!provider) notFound();

  const favIds = await getFavoriteProviderIds(userId);
  const favorited = favIds.includes(provider.userId);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={ROUTES.customer.search}
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="size-4" />
        Back to search
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-2xl font-semibold text-[var(--primary-foreground)]">
            {(provider.name ?? "?").charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{provider.name ?? "Provider"}</h1>
            {provider.categoryName && (
              <p className="text-sm text-[var(--muted-foreground)]">{provider.categoryName}</p>
            )}
            <div className="mt-1 flex items-center gap-2">
              <Stars rating={provider.averageRating} />
              <span className="text-xs text-[var(--muted-foreground)]">
                {provider.reviewCount > 0
                  ? `${provider.averageRating.toFixed(1)} (${provider.reviewCount})`
                  : "No reviews yet"}
              </span>
            </div>
          </div>
        </div>
        <FavoriteButton providerUserId={provider.userId} initialFavorited={favorited} />
      </div>

      {(provider.description || provider.bio) && (
        <p className="mt-6 whitespace-pre-wrap text-sm text-[var(--muted-foreground)]">
          {provider.description ?? provider.bio}
        </p>
      )}

      <h2 className="mb-3 mt-8 text-lg font-semibold tracking-tight">Services</h2>
      {provider.services.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          This provider hasn&apos;t listed any services yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {provider.services.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{s.title}</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {formatCurrency(s.price)} · {s.durationMin} min
                </p>
              </div>
              <Link
                href={ROUTES.customer.book(s.id)}
                className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
              >
                Book
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
