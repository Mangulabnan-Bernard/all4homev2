"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCan } from "@/lib/permissions/guard";
import { ok, fail, failFrom, type Result } from "@/lib/result";

const favoriteSchema = z.object({ providerId: z.string().min(1) }).strict();

export async function addFavoriteAction(input: unknown): Promise<Result<null>> {
  try {
    const user = await requireCan("favorite:manage");
    const parsed = favoriteSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const { providerId } = parsed.data;
    await prisma.favoriteProvider.upsert({
      where: { userId_providerId: { userId: user.id, providerId } },
      update: {},
      create: { userId: user.id, providerId },
    });
    revalidatePath("/customer/favorites");
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}

export async function removeFavoriteAction(input: unknown): Promise<Result<null>> {
  try {
    const user = await requireCan("favorite:manage");
    const parsed = favoriteSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const { providerId } = parsed.data;
    await prisma.favoriteProvider.deleteMany({
      where: { userId: user.id, providerId },
    });
    revalidatePath("/customer/favorites");
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
