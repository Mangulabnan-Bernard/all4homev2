"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { updateDisputeStatusSchema } from "@/lib/validators/disputes";
import { requireCan } from "@/lib/permissions/guard";
import { writeAuditLog } from "@/lib/audit";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/**
 * Admin moves an open dispute into review (OPEN -> UNDER_REVIEW). Only open
 * disputes can be moved; the transition is recorded in the audit log.
 */
export async function updateDisputeStatusAction(input: unknown): Promise<Result<null>> {
  try {
    const admin = await requireCan("dispute:updateStatus");
    const parsed = updateDisputeStatusSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const { disputeId } = parsed.data;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      select: { id: true, status: true },
    });
    if (!dispute) return fail("NOT_FOUND", "Dispute not found.");
    if (dispute.status !== "OPEN") {
      return fail("INVALID_STATE", "Only open disputes can be moved to review.");
    }

    await prisma.dispute.update({
      where: { id: disputeId },
      data: { status: "UNDER_REVIEW" },
    });
    await writeAuditLog({
      actorId: admin.id,
      action: "STATUS_CHANGE",
      entity: "Dispute",
      entityId: disputeId,
      metadata: { to: "UNDER_REVIEW" },
    });

    revalidatePath("/admin/disputes");
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
