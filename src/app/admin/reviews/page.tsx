import type { Metadata } from "next";

import { getAllReviews } from "@/features/reviews/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Stars } from "@/components/reviews/stars";
import { DeleteReviewButton } from "@/components/admin/delete-review-button";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await getAllReviews();

  return (
    <div>
      <PageHeader title="Reviews" description="Moderate reviews across the platform." />

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">No reviews yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <Stars rating={r.rating} />
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {formatDate(r.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium">{r.authorName ?? "A customer"}</p>
                {r.comment && (
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">{r.comment}</p>
                )}
              </div>
              <DeleteReviewButton reviewId={r.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
