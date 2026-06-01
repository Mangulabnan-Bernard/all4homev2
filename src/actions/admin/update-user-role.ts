"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { updateUserRoleSchema } from "@/lib/validators/admin";
import { requireCan } from "@/lib/permissions/guard";
import { writeAuditLog } from "@/lib/audit";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/** Admin changes a user's role. Admins can't change their own role (no self-lockout). */
export async function updateUserRoleAction(input: unknown): Promise<Result<null>> {
  try {
    const admin = await requireCan("user:updateRole");
    const parsed = updateUserRoleSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Invalid request.", parsed.error.flatten().fieldErrors);
    }
    const { userId, role } = parsed.data;
    if (userId === admin.id) return fail("FORBIDDEN", "You can't change your own role.");

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!target) return fail("NOT_FOUND", "User not found.");

    await prisma.user.update({ where: { id: userId }, data: { role } });
    await writeAuditLog({
      actorId: admin.id,
      action: "UPDATE",
      entity: "User",
      entityId: userId,
      metadata: { role },
    });
    revalidatePath("/admin/users");
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
