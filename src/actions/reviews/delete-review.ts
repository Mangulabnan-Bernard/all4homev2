"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { idSchema } from "@/lib/validators/common";
import { requireCan, assertCanOn } from "@/lib/permissions/guard";
import { recomputeProviderRating } from "@/lib/ratings";
import { writeAuditLog } from "@/lib/audit";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/**
 * Delete a review. The author (or an admin) may remove it; ownership is asserted
 * on the loaded row so missing/forbidden look identical (IDOR-safe). Recomputes
 * the provider's rating aggregate from source in the same transaction so the
 * average can't drift after a row is removed.
 */
export async function deleteReviewAction(input: unknown): Promise<Result<null>> {
  try {
    const user = await requireCan("review:delete");
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const { id } = parsed.data;

    const review = await prisma.review.findUnique({
      where: { id },
      select: { id: true, authorId: true, providerId: true },
    });
    if (!review) return fail("NOT_FOUND", "Review not found.");
    assertCanOn(user, "review:delete", { ownerIds: [review.authorId] });

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id } });
      await recomputeProviderRating(tx, review.providerId);
      await writeAuditLog(
        { actorId: user.id, action: "DELETE", entity: "Review", entityId: id },
        tx,
      );
    });

    revalidatePath("/provider/reviews");
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
