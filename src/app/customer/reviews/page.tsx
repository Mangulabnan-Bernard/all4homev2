import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getCustomerReviews } from "@/features/reviews/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Stars } from "@/components/reviews/stars";
import { ROUTES } from "@/constants";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "My reviews" };
export const dynamic = "force-dynamic";

export default async function CustomerReviewsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);

  const reviews = await getCustomerReviews(userId);

  return (
    <div>
      <PageHeader title="My reviews" description="Reviews you've left for providers." />
      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            You haven&apos;t left any reviews yet. You can review a booking once it&apos;s confirmed.
          </p>
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
              {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
              <Link
                href={ROUTES.customer.booking(r.bookingId)}
                className="mt-2 inline-block text-xs font-medium text-[var(--primary)] hover:underline"
              >
                View booking
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
