import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Random, URL-safe reset token (the RAW value is emailed; only its hash is stored). */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/** SHA-256 of a raw token, for at-rest storage so a DB leak can't be used to reset. */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
