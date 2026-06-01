import type { Prisma } from "@prisma/client";

/**
 * Recompute a provider's averageRating + reviewCount FROM the review rows
 * (never incrementally) so concurrent reviews can't drift or lose updates.
 * Call inside the same transaction as the review mutation.
 */
export async function recomputeProviderRating(
  tx: Prisma.TransactionClient,
  providerId: string,
): Promise<void> {
  const agg = await tx.review.aggregate({
    where: { providerId },
    _avg: { rating: true },
    _count: true,
  });
  await tx.providerProfile.update({
    where: { id: providerId },
    data: { averageRating: agg._avg.rating ?? 0, reviewCount: agg._count },
  });
}
