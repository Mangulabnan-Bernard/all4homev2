import { prisma } from "@/lib/prisma";
import type { ReviewDTO } from "@/types/dto";

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  bookingId: string;
  createdAt: Date;
  author: { name: string | null };
};

function toReviewDTO(r: ReviewRow): ReviewDTO {
  return {
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    authorName: r.author.name,
    bookingId: r.bookingId,
    createdAt: r.createdAt.toISOString(),
  };
}

/** Reviews for a provider (by ProviderProfile id), newest first. */
export async function getProviderReviews(providerId: string): Promise<ReviewDTO[]> {
  const rows = await prisma.review.findMany({
    where: { providerId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });
  return rows.map(toReviewDTO);
}

/** Reviews authored by a customer (by User id), newest first. */
export async function getCustomerReviews(userId: string): Promise<ReviewDTO[]> {
  const rows = await prisma.review.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });
  return rows.map(toReviewDTO);
}

/** The single review for a booking, or null if none exists. */
export async function getReviewForBooking(bookingId: string): Promise<ReviewDTO | null> {
  const row = await prisma.review.findUnique({
    where: { bookingId },
    include: { author: { select: { name: true } } },
  });
  if (!row) return null;
  return toReviewDTO(row);
}
