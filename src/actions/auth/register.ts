"use server";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";
import { hashPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/audit";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/**
 * Create a credentials account. Public action. Role is restricted to
 * CUSTOMER/PROVIDER at the schema level (ADMIN can never be self-assigned).
 */
export async function registerAction(input: unknown): Promise<Result<{ id: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
  }
  const { name, email, password, role } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return fail("CONFLICT", "An account with that email already exists.");
    }
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role, isVerified: false },
      select: { id: true },
    });
    await writeAuditLog({
      actorId: user.id,
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      metadata: { via: "credentials", role },
    });
    return ok({ id: user.id });
  } catch (e) {
    return failFrom(e);
  }
}
