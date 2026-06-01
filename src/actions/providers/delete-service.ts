"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { idSchema } from "@/lib/validators/common";
import { requireCan, assertCanOn } from "@/lib/permissions/guard";
import { writeAuditLog } from "@/lib/audit";
import { ok, fail, failFrom, type Result } from "@/lib/result";

export async function deleteServiceAction(input: unknown): Promise<Result<null>> {
  try {
    const user = await requireCan("service:delete");
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const { id } = parsed.data;
    const svc = await prisma.service.findUnique({
      where: { id },
      include: { provider: { select: { userId: true } } },
    });
    if (!svc) return fail("NOT_FOUND", "Service not found.");
    assertCanOn(user, "service:delete", { ownerIds: [svc.provider.userId] });
    await prisma.service.delete({ where: { id } });
    await writeAuditLog({ actorId: user.id, action: "DELETE", entity: "Service", entityId: id });
    revalidatePath("/provider/services");
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
