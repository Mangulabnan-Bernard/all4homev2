"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { idSchema } from "@/lib/validators/common";
import { requireUser } from "@/lib/permissions/guard";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/**
 * Mark one of the caller's own notifications as read. Scoped to the caller's
 * userId via updateMany so it can never touch another user's notifications.
 */
export async function markNotificationReadAction(input: unknown): Promise<Result<null>> {
  try {
    const user = await requireUser();
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Invalid notification.", parsed.error.flatten().fieldErrors);
    }
    const { id } = parsed.data;

    await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { read: true },
    });

    revalidatePath("/customer/notifications");
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
