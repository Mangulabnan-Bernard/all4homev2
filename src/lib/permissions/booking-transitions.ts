import type { BookingStatus } from "@prisma/client";

/**
 * Single source of truth for the booking state machine (see MASTER_PLAN §6.1).
 * `assertTransition` (pure) is the only thing allowed to authorize a status
 * change, and it is always called inside a `$transaction` after a locking
 * re-read so the `from` status cannot change under a concurrent actor.
 */
export type Actor = "CUSTOMER" | "PROVIDER" | "ADMIN";

interface TransitionRule {
  to: BookingStatus;
  actors: Actor[];
}

export const BOOKING_TRANSITIONS: Record<BookingStatus, TransitionRule[]> = {
  PENDING: [
    { to: "ACCEPTED", actors: ["PROVIDER", "ADMIN"] },
    { to: "CANCELED", actors: ["CUSTOMER", "PROVIDER", "ADMIN"] },
  ],
  ACCEPTED: [
    { to: "IN_PROGRESS", actors: ["PROVIDER", "ADMIN"] },
    { to: "CANCELED", actors: ["CUSTOMER", "PROVIDER", "ADMIN"] },
  ],
  IN_PROGRESS: [{ to: "COMPLETED", actors: ["PROVIDER", "ADMIN"] }],
  COMPLETED: [
    { to: "CONFIRMED", actors: ["CUSTOMER", "ADMIN"] },
    { to: "DISPUTED", actors: ["CUSTOMER", "ADMIN"] },
  ],
  CONFIRMED: [
    { to: "CLOSED", actors: ["ADMIN"] },
    { to: "DISPUTED", actors: ["CUSTOMER", "PROVIDER", "ADMIN"] },
  ],
  DISPUTED: [
    { to: "CLOSED", actors: ["ADMIN"] },
    { to: "IN_PROGRESS", actors: ["ADMIN"] },
  ],
  CLOSED: [],
  CANCELED: [],
};
