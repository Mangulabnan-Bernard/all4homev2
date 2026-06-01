"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { providerProfileSchema } from "@/lib/validators/providers";
import { requireCan } from "@/lib/permissions/guard";
import { writeAuditLog } from "@/lib/audit";
import { ok, fail, failFrom, type Result } from "@/lib/result";

export async function updateProfileAction(input: unknown): Promise<Result<{ id: string }>> {
  try {
    const user = await requireCan("provider:editProfile");
    const profile = await prisma.providerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) return fail("NOT_FOUND", "Create your provider profile first.");

    const parsed = providerProfileSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const data = parsed.data;

    if (data.categoryId !== undefined) {
      const category = await prisma.serviceCategory.findUnique({
        where: { id: data.categoryId },
        select: { id: true },
      });
      if (!category) return fail("NOT_FOUND", "Selected category does not exist.");
    }

    const updateData: {
      categoryId?: string;
      bio?: string;
      description?: string;
      hourlyRate?: number;
      experienceYears?: number;
      serviceRadiusKm?: number;
    } = {};
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;
    if (data.experienceYears !== undefined) updateData.experienceYears = data.experienceYears;
    if (data.serviceRadiusKm !== undefined) updateData.serviceRadiusKm = data.serviceRadiusKm;

    await prisma.providerProfile.update({
      where: { id: profile.id },
      data: updateData,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "UPDATE",
      entity: "ProviderProfile",
      entityId: profile.id,
    });

    revalidatePath("/provider/profile");
    return ok({ id: profile.id });
  } catch (e) {
    return failFrom(e);
  }
}
