import type { UserRole } from "@prisma/client";
import { type Action, CAPABILITIES } from "./matrix";

/** Minimal identity used for authorization. Always derived from the session + DB. */
export interface Principal {
  id: string;
  role: UserRole;
}

/** Capability check: does this role hold the action at all? */
export function can(principal: Principal, action: Action): boolean {
  return CAPABILITIES[principal.role].has(action);
}

/**
 * Capability + ownership check. ADMIN bypasses ownership (still audited at the
 * action layer). For non-admins, the principal's id must be one of the
 * resource's owner ids (e.g. a booking's customer User id or its provider's
 * User id). Pass every legitimate owner id for the resource.
 */
export function canOn(
  principal: Principal,
  action: Action,
  resource: { ownerIds: Array<string | null | undefined> },
): boolean {
  if (!can(principal, action)) return false;
  if (principal.role === "ADMIN") return true;
  return resource.ownerIds.includes(principal.id);
}
