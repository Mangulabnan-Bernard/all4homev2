"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { idSchema } from "@/lib/validators/common";
import { requireCan } from "@/lib/permissions/guard";
import { writeAuditLog } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { ok, fail, failFrom, type Result } from "@/lib/result";

export async function approveProviderAction(input: unknown): Promise<Result<null>> {
  try {
    const admin = await requireCan("provider:approve");
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const { id } = parsed.data;
    const profile = await prisma.providerProfile.findUnique({
      where: { id },
      select: { id: true, userId: true, verificationStatus: true },
    });
    if (!profile) return fail("NOT_FOUND", "Provider application not found.");
    if (profile.verificationStatus !== "PENDING") {
      return fail("INVALID_STATE", "Only pending applications can be approved.");
    }
    await prisma.$transaction(async (tx) => {
      await tx.providerProfile.update({
        where: { id },
        data: { verificationStatus: "APPROVED", approvedAt: new Date() },
      });
      await tx.user.update({
        where: { id: profile.userId },
        data: { role: "PROVIDER", isVerified: true },
      });
      await notify(
        {
          userId: profile.userId,
          type: "PROVIDER_APPROVED",
          title: "You're approved!",
          message: "Your provider application has been approved.",
        },
        tx,
      );
      await writeAuditLog(
        { actorId: admin.id, action: "APPROVE", entity: "ProviderProfile", entityId: id },
        tx,
      );
    });
    revalidatePath("/admin/providers");
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}

export async function rejectProviderAction(input: unknown): Promise<Result<null>> {
  try {
    const admin = await requireCan("provider:reject");
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const { id } = parsed.data;
    const profile = await prisma.providerProfile.findUnique({
      where: { id },
      select: { id: true, userId: true, verificationStatus: true },
    });
    if (!profile) return fail("NOT_FOUND", "Provider application not found.");
    if (profile.verificationStatus !== "PENDING") {
      return fail("INVALID_STATE", "Only pending applications can be rejected.");
    }
    await prisma.$transaction(async (tx) => {
      await tx.providerProfile.update({
        where: { id },
        data: { verificationStatus: "REJECTED" },
      });
      await notify(
        {
          userId: profile.userId,
          type: "PROVIDER_REJECTED",
          title: "Application update",
          message: "Your provider application was not approved.",
        },
        tx,
      );
      await writeAuditLog(
        { actorId: admin.id, action: "REJECT", entity: "ProviderProfile", entityId: id },
        tx,
      );
    });
    revalidatePath("/admin/providers");
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}

export async function verifyDocumentAction(input: unknown): Promise<Result<null>> {
  try {
    const admin = await requireCan("provider:verifyDocument");
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const { id } = parsed.data;
    const doc = await prisma.providerDocument.findUnique({
      where: { id },
      include: { provider: { select: { userId: true } } },
    });
    if (!doc) return fail("NOT_FOUND", "Document not found.");
    await prisma.$transaction(async (tx) => {
      await tx.providerDocument.update({
        where: { id },
        data: { verified: true, verifiedAt: new Date() },
      });
      await notify(
        {
          userId: doc.provider.userId,
          type: "DOCUMENT_VERIFIED",
          title: "Document verified",
          message: "One of your documents was verified.",
        },
        tx,
      );
      await writeAuditLog(
        { actorId: admin.id, action: "APPROVE", entity: "ProviderDocument", entityId: id },
        tx,
      );
    });
    revalidatePath("/admin/providers");
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
