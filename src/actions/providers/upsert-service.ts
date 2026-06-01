"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { serviceSchema } from "@/lib/validators/providers";
import { requireCan } from "@/lib/permissions/guard";
import { writeAuditLog } from "@/lib/audit";
import { ok, fail, failFrom, type Result } from "@/lib/result";

export async function upsertServiceAction(input: unknown): Promise<Result<{ id: string }>> {
  try {
    const user = await requireCan("service:create");
    const profile = await prisma.providerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) return fail("NOT_FOUND", "Create your provider profile first.");

    const parsed = serviceSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const data = parsed.data;

    const category = await prisma.serviceCategory.findUnique({
      where: { id: data.categoryId },
      select: { id: true },
    });
    if (!category) return fail("NOT_FOUND", "Category not found.");

    if (data.id) {
      const existing = await prisma.service.findUnique({
        where: { id: data.id },
        select: { id: true, providerId: true },
      });
      if (!existing || existing.providerId !== profile.id) {
        return fail("NOT_FOUND", "Service not found.");
      }
      const updated = await prisma.service.update({
        where: { id: existing.id },
        data: {
          title: data.title,
          description: data.description,
          price: data.price,
          durationMin: data.durationMin,
          isActive: data.isActive,
          categoryId: data.categoryId,
        },
        select: { id: true },
      });
      await writeAuditLog({ actorId: user.id, action: "UPDATE", entity: "Service", entityId: updated.id });
      revalidatePath("/provider/services");
      return ok({ id: updated.id });
    }

    const created = await prisma.service.create({
      data: {
        providerId: profile.id,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        price: data.price,
        durationMin: data.durationMin,
        isActive: data.isActive,
      },
      select: { id: true },
    });
    await writeAuditLog({ actorId: user.id, action: "CREATE", entity: "Service", entityId: created.id });
    revalidatePath("/provider/services");
    return ok({ id: created.id });
  } catch (e) {
    return failFrom(e);
  }
}
