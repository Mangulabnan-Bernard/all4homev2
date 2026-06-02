import Link from "next/link";
import type { ProviderCardDTO } from "@/types/dto";
import { ROUTES } from "@/constants";
import { formatCurrency } from "@/lib/format";
import { Stars } from "@/components/reviews/stars";
import { FavoriteButton } from "./favorite-button";

export function ProviderCard({
  provider,
  favorited,
}: {
  provider: ProviderCardDTO;
  favorited: boolean;
}) {
  return (
    <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition hover:shadow-md">
      <div className="absolute right-3 top-3">
        <FavoriteButton providerUserId={provider.userId} initialFavorited={favorited} />
      </div>

      <Link href={ROUTES.customer.provider(provider.id)} className="block">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-lg font-semibold text-[var(--primary-foreground)]">
            {(provider.name ?? "?").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 pr-8">
            <p className="truncate font-semibold">{provider.name ?? "Provider"}</p>
            {provider.categoryName && (
              <p className="truncate text-xs text-[var(--muted-foreground)]">
                {provider.categoryName}
              </p>
            )}
          </div>
        </div>

        {provider.bio && (
          <p className="mt-3 line-clamp-2 text-sm text-[var(--muted-foreground)]">{provider.bio}</p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3">
          <div className="flex items-center gap-1.5">
            <Stars rating={provider.averageRating} />
            <span className="text-xs text-[var(--muted-foreground)]">({provider.reviewCount})</span>
          </div>
          <span className="text-sm text-[var(--muted-foreground)]">
            from{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {formatCurrency(provider.fromPrice)}
            </span>
          </span>
        </div>
      </Link>
    </div>
  );
}
