import type { BookingStatus, UserRole } from "@prisma/client";
import { BOOKING_TRANSITIONS, type Actor } from "./booking-transitions";
import { ForbiddenError, InvalidStateError } from "@/lib/errors";

interface SessionUser {
  id: string;
  role: UserRole;
}

/**
 * The facts the guard needs, loaded from the DB. `providerUserId` is reached via
 * `Booking.providerId -> ProviderProfile.userId` (never a column on Booking).
 */
export interface BookingFacts {
  status: BookingStatus;
  customerId: string;
  providerUserId: string;
}

function resolveActor(b: BookingFacts, u: SessionUser): Actor | null {
  if (u.role === "ADMIN") return "ADMIN";
  if (u.role === "CUSTOMER" && b.customerId === u.id) return "CUSTOMER";
  if (u.role === "PROVIDER" && b.providerUserId === u.id) return "PROVIDER";
  return null;
}

/**
 * Pure guard (no I/O, unit-testable). Throws an AppError on illegal transition
 * or insufficient ownership/role; returns the resolved Actor on success.
 */
export function assertTransition(b: BookingFacts, to: BookingStatus, u: SessionUser): Actor {
  const actor = resolveActor(b, u);
  if (!actor) throw new ForbiddenError();
  const rule = BOOKING_TRANSITIONS[b.status].find((r) => r.to === to);
  if (!rule) throw new InvalidStateError(`Cannot move a ${b.status} booking to ${to}.`);
  if (!rule.actors.includes(actor)) throw new ForbiddenError();
  return actor;
}
