import type { UserRole } from "@prisma/client";

/**
 * The full capability vocabulary. Every privileged operation maps to one of
 * these `Action` strings; server actions call `requireCan(action)` before doing
 * anything. Ownership ("own booking") is a separate check (`canOn`) layered on
 * top of the capability — see can.ts. ADMIN holds every capability.
 */
export const ACTIONS = [
  // bookings
  "booking:create",
  "booking:read",
  "booking:accept",
  "booking:start",
  "booking:complete",
  "booking:confirm",
  "booking:cancel",
  "booking:dispute",
  // providers
  "provider:apply",
  "provider:read",
  "provider:editProfile",
  "provider:approve",
  "provider:reject",
  "provider:verifyDocument",
  // services
  "service:create",
  "service:edit",
  "service:delete",
  // reviews
  "review:create",
  "review:update",
  "review:delete",
  "review:moderate",
  // disputes
  "dispute:open",
  "dispute:updateStatus",
  "dispute:resolve",
  // messaging + notifications
  "message:send",
  "message:read",
  "notification:read",
  // user + favorites
  "user:editProfile",
  "user:ban",
  "user:updateRole",
  "favorite:manage",
  // admin-only domains
  "category:manage",
  "payment:read",
  "payment:refund",
  "auditlog:read",
  "analytics:read",
] as const;

export type Action = (typeof ACTIONS)[number];

const CUSTOMER_ACTIONS: Action[] = [
  "booking:create",
  "booking:read",
  "booking:confirm",
  "booking:cancel",
  "booking:dispute",
  "provider:apply",
  "provider:read",
  "review:create",
  "review:update",
  "review:delete",
  "dispute:open",
  "message:send",
  "message:read",
  "notification:read",
  "user:editProfile",
  "favorite:manage",
];

const PROVIDER_ACTIONS: Action[] = [
  "booking:read",
  "booking:accept",
  "booking:start",
  "booking:complete",
  "booking:cancel",
  "booking:dispute",
  "provider:read",
  "provider:editProfile",
  "service:create",
  "service:edit",
  "service:delete",
  "dispute:open",
  "message:send",
  "message:read",
  "notification:read",
  "user:editProfile",
];

/** Role -> set of granted capabilities. ADMIN is granted all ACTIONS. */
export const CAPABILITIES: Record<UserRole, ReadonlySet<Action>> = {
  CUSTOMER: new Set(CUSTOMER_ACTIONS),
  PROVIDER: new Set(PROVIDER_ACTIONS),
  ADMIN: new Set(ACTIONS),
};
