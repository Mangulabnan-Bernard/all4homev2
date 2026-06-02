import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getMyProviderProfile } from "@/features/providers/queries";
import { getProviderReviews } from "@/features/reviews/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Stars } from "@/components/reviews/stars";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

export default async function ProviderReviewsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);

  const profile = await getMyProviderProfile(userId);
  if (!profile) {
    return (
      <div>
        <PageHeader title="Reviews" description="What customers say about your work." />
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Set up your provider profile to start receiving reviews.
          </p>
          <Link href={ROUTES.provider.apply} className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
            Start your application
          </Link>
        </div>
      </div>
    );
  }

  const reviews = await getProviderReviews(profile.id);

  return (
    <div>
      <PageHeader title="Reviews" description="What customers say about your work." />
      <div className="mb-6 flex items-center gap-2">
        <Stars rating={profile.averageRating} />
        <span className="text-sm text-[var(--muted-foreground)]">
          {profile.reviewCount > 0
            ? `${profile.averageRating.toFixed(1)} · ${profile.reviewCount} review${profile.reviewCount === 1 ? "" : "s"}`
            : "No ratings yet"}
        </span>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">No reviews yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <Stars rating={r.rating} />
                <span className="text-xs text-[var(--muted-foreground)]">
                  {formatDate(r.createdAt)}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium">{r.authorName ?? "A customer"}</p>
              {r.comment && (
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{r.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
