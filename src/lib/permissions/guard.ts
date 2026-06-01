import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, UnauthenticatedError } from "@/lib/errors";
import { can, canOn, type Principal } from "./can";
import type { Action } from "./matrix";

export interface CurrentUser extends Principal {
  email: string;
  name: string | null;
}

/**
 * Resolve the caller from the session, then RE-READ role/isActive from the DB.
 * This is the load-bearing security rule: a banned or role-changed user is
 * rejected at the action layer even with a cryptographically valid JWT. Returns
 * null when unauthenticated/inactive (use requireUser to throw instead).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, email: true, name: true, isActive: true },
  });
  if (!user || !user.isActive) return null;
  return { id: user.id, role: user.role, email: user.email, name: user.name };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}

/** Require authentication AND the given capability. */
export async function requireCan(action: Action): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user, action)) throw new ForbiddenError();
  return user;
}

/**
 * Ownership assertion for an already-loaded resource. "Not found" and
 * "forbidden" intentionally surface the same generic error to prevent resource
 * enumeration (IDOR-safe).
 */
export function assertCanOn(
  user: Principal,
  action: Action,
  resource: { ownerIds: Array<string | null | undefined> },
): void {
  if (!canOn(user, action, resource)) throw new ForbiddenError();
}
