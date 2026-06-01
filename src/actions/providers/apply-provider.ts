"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { providerApplicationSchema } from "@/lib/validators/providers";
import { requireCan } from "@/lib/permissions/guard";
import { writeAuditLog } from "@/lib/audit";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/**
 * A CUSTOMER applies to become a provider. Creates a PENDING ProviderProfile
 * (role stays CUSTOMER until an admin approves). One profile per user.
 */
export async function applyProviderAction(input: unknown): Promise<Result<{ profileId: string }>> {
  try {
    const user = await requireCan("provider:apply");

    const parsed = providerApplicationSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const data = parsed.data;

    const existing = await prisma.providerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (existing) return fail("CONFLICT", "You already have a provider profile.");

    const category = await prisma.serviceCategory.findUnique({
      where: { id: data.categoryId },
      select: { id: true },
    });
    if (!category) return fail("NOT_FOUND", "That category doesn't exist.");

    const profile = await prisma.providerProfile.create({
      data: {
        userId: user.id,
        categoryId: data.categoryId,
        bio: data.bio,
        hourlyRate: data.hourlyRate,
        experienceYears: data.experienceYears,
        serviceRadiusKm: data.serviceRadiusKm,
        verificationStatus: "PENDING",
      },
      select: { id: true },
    });

    await writeAuditLog({
      actorId: user.id,
      action: "CREATE",
      entity: "ProviderProfile",
      entityId: profile.id,
    });
    revalidatePath("/provider/apply");
    return ok({ profileId: profile.id });
  } catch (e) {
    return failFrom(e);
  }
}
