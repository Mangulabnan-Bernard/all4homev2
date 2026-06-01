"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { toggleUserActiveSchema } from "@/lib/validators/admin";
import { requireCan } from "@/lib/permissions/guard";
import { writeAuditLog } from "@/lib/audit";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/** Admin activates/deactivates (bans) a user. Admins can't ban themselves. */
export async function toggleUserActiveAction(input: unknown): Promise<Result<null>> {
  try {
    const admin = await requireCan("user:ban");
    const parsed = toggleUserActiveSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Invalid request.", parsed.error.flatten().fieldErrors);
    }
    const { userId, isActive } = parsed.data;
    if (userId === admin.id) return fail("FORBIDDEN", "You can't change your own active status.");

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!target) return fail("NOT_FOUND", "User not found.");

    await prisma.user.update({ where: { id: userId }, data: { isActive } });
    await writeAuditLog({
      actorId: admin.id,
      action: isActive ? "UPDATE" : "SUSPEND",
      entity: "User",
      entityId: userId,
      metadata: { isActive },
    });
    revalidatePath("/admin/users");
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
