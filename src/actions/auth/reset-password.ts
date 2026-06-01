"use server";

import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { hashPassword, hashToken } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/audit";
import { ok, fail, failFrom, type Result } from "@/lib/result";

const RESET_PREFIX = "pwreset:";

/**
 * Consume a reset token (single-use) and set a new password. The token is
 * looked up by its hash; on success the password is updated and the token
 * deleted in one transaction.
 */
export async function resetPasswordAction(input: unknown): Promise<Result<null>> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
  }
  const { token, password } = parsed.data;

  try {
    const hashed = hashToken(token);
    const record = await prisma.verificationToken.findUnique({ where: { token: hashed } });
    if (!record || !record.identifier.startsWith(RESET_PREFIX) || record.expires < new Date()) {
      return fail("VALIDATION", "This reset link is invalid or has expired.");
    }
    const email = record.identifier.slice(RESET_PREFIX.length);
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      return fail("VALIDATION", "This reset link is invalid or has expired.");
    }
    const newHash = await hashPassword(password);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { password: newHash } }),
      prisma.verificationToken.delete({ where: { token: hashed } }),
    ]);
    await writeAuditLog({
      actorId: user.id,
      action: "UPDATE",
      entity: "User",
      entityId: user.id,
      metadata: { kind: "password_reset" },
    });
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
