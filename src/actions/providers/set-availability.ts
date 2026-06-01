"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { availabilitySchema } from "@/lib/validators/providers";
import { requireCan } from "@/lib/permissions/guard";
import { writeAuditLog } from "@/lib/audit";
import { ok, fail, failFrom, type Result } from "@/lib/result";

export async function setAvailabilityAction(input: unknown): Promise<Result<null>> {
  try {
    const user = await requireCan("provider:editProfile");
    const profile = await prisma.providerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) return fail("NOT_FOUND", "Create your provider profile first.");
    const parsed = availabilitySchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    await prisma.$transaction([
      prisma.providerAvailability.deleteMany({ where: { providerId: profile.id } }),
      prisma.providerAvailability.createMany({
        data: parsed.data.slots.map((s) => ({
          providerId: profile.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      }),
    ]);
    await writeAuditLog({
      actorId: user.id,
      action: "UPDATE",
      entity: "ProviderProfile",
      entityId: profile.id,
      metadata: { kind: "availability" },
    });
    revalidatePath("/provider/availability");
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
