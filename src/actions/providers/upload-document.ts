"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { documentSchema } from "@/lib/validators/providers";
import { requireUser } from "@/lib/permissions/guard";
import { writeAuditLog } from "@/lib/audit";
import { ok, fail, failFrom, type Result } from "@/lib/result";

export async function uploadDocumentAction(input: unknown): Promise<Result<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = documentSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const profile = await prisma.providerProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!profile) return fail("NOT_FOUND", "Create your provider profile first.");
    const doc = await prisma.providerDocument.create({ data: { providerId: profile.id, type: parsed.data.type, url: parsed.data.url }, select: { id: true } });
    await writeAuditLog({ actorId: user.id, action: "CREATE", entity: "ProviderDocument", entityId: doc.id });
    revalidatePath("/provider/documents");
    return ok({ id: doc.id });
  } catch (e) {
    return failFrom(e);
  }
}
