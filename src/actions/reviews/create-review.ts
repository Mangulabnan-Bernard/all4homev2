"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createReviewSchema } from "@/lib/validators/reviews";
import { requireCan } from "@/lib/permissions/guard";
import { recomputeProviderRating } from "@/lib/ratings";
import { writeAuditLog } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/**
 * Customer reviews a booking they own, once it's CONFIRMED/CLOSED. One review
 * per booking. Recomputes the provider's rating aggregate from source in the
 * same transaction so concurrent reviews can't drift.
 */
export async function createReviewAction(input: unknown): Promise<Result<{ id: string }>> {
  try {
    const user = await requireCan("review:create");
    const parsed = createReviewSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const { bookingId, rating, comment } = parsed.data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        customerId: true,
        providerId: true,
        provider: { select: { userId: true } },
        review: { select: { id: true } },
      },
    });
    if (!booking) return fail("NOT_FOUND", "Booking not found.");
    if (booking.customerId !== user.id) {
      return fail("FORBIDDEN", "You can only review your own bookings.");
    }
    if (booking.status !== "CONFIRMED" && booking.status !== "CLOSED") {
      return fail("INVALID_STATE", "You can review a booking once it's confirmed.");
    }
    if (booking.review) return fail("CONFLICT", "You've already reviewed this booking.");

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          bookingId,
          authorId: user.id,
          targetId: booking.provider.userId,
          providerId: booking.providerId,
          rating,
          comment,
        },
        select: { id: true },
      });
      await recomputeProviderRating(tx, booking.providerId);
      await notify(
        {
          userId: booking.provider.userId,
          type: "REVIEW_RECEIVED",
          title: "New review",
          message: "You received a new review.",
          link: "/provider/reviews",
        },
        tx,
      );
      await writeAuditLog(
        { actorId: user.id, action: "CREATE", entity: "Review", entityId: created.id },
        tx,
      );
      return created;
    });

    revalidatePath(`/customer/bookings/${bookingId}`);
    return ok({ id: review.id });
  } catch (e) {
    return failFrom(e);
  }
}
