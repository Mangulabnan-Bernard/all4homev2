"use server";

import { prisma } from "@/lib/prisma";
import { toggleDarkModeSchema } from "@/lib/validators/user";
import { requireUser } from "@/lib/permissions/guard";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/** Persist the user's dark-mode preference (the transient UI store mirrors it). */
export async function toggleDarkModeAction(input: unknown): Promise<Result<{ darkMode: boolean }>> {
  try {
    const user = await requireUser();
    const parsed = toggleDarkModeSchema.safeParse(input);
    if (!parsed.success) return fail("VALIDATION", "Invalid request.");
    await prisma.user.update({ where: { id: user.id }, data: { darkMode: parsed.data.darkMode } });
    return ok({ darkMode: parsed.data.darkMode });
  } catch (e) {
    return failFrom(e);
  }
}
