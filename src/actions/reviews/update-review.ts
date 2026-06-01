"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { updateReviewSchema } from "@/lib/validators/reviews";
import { requireCan, assertCanOn } from "@/lib/permissions/guard";
import { recomputeProviderRating } from "@/lib/ratings";
import { writeAuditLog } from "@/lib/audit";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/**
 * Author edits their own review's rating/comment. Recomputes the provider's
 * rating aggregate from source in the same transaction so the average stays
 * consistent with the edited rating.
 */
export async function updateReviewAction(input: unknown): Promise<Result<{ id: string }>> {
  try {
    const user = await requireCan("review:update");
    const parsed = updateReviewSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const { id, rating, comment } = parsed.data;

    const review = await prisma.review.findUnique({
      where: { id },
      select: { id: true, authorId: true, providerId: true },
    });
    if (!review) return fail("NOT_FOUND", "Review not found.");
    assertCanOn(user, "review:update", { ownerIds: [review.authorId] });

    await prisma.$transaction(async (tx) => {
      await tx.review.update({ where: { id }, data: { rating, comment } });
      await recomputeProviderRating(tx, review.providerId);
      await writeAuditLog(
        { actorId: user.id, action: "UPDATE", entity: "Review", entityId: id },
        tx,
      );
    });

    revalidatePath("/provider/reviews");
    return ok({ id });
  } catch (e) {
    return failFrom(e);
  }
}
