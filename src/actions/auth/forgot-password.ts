"use server";

import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { generateToken, hashToken } from "@/lib/auth/password";
import { sendResetEmail } from "@/lib/mail";
import { ok, fail, failFrom, type Result } from "@/lib/result";

const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes
const RESET_PREFIX = "pwreset:";

/**
 * Issue a single-use password-reset token. Always returns ok (no account
 * enumeration). Only credentials accounts (with a password) get an email; the
 * raw token is emailed, only its SHA-256 hash is stored.
 */
export async function forgotPasswordAction(input: unknown): Promise<Result<null>> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return fail("VALIDATION", "Enter a valid email address.", parsed.error.flatten().fieldErrors);
  }
  const { email } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { password: true } });
    if (user?.password) {
      const raw = generateToken();
      const identifier = `${RESET_PREFIX}${email}`;
      // Invalidate any previous reset tokens for this identifier.
      await prisma.verificationToken.deleteMany({ where: { identifier } });
      await prisma.verificationToken.create({
        data: { identifier, token: hashToken(raw), expires: new Date(Date.now() + RESET_TTL_MS) },
      });
      const base =
        process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
      await sendResetEmail(email, `${base}/reset-password?token=${raw}`);
    }
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
