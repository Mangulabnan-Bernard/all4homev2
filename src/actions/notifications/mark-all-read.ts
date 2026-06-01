"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions/guard";
import { ok, failFrom, type Result } from "@/lib/result";

/**
 * Mark all of the caller's unread notifications as read. Scoped to the current
 * user, so there's no resource to look up or ownership to assert beyond the
 * authenticated identity.
 */
export async function markAllNotificationsReadAction(): Promise<Result<null>> {
  try {
    const user = await requireUser();

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });

    revalidatePath("/customer/notifications");
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
