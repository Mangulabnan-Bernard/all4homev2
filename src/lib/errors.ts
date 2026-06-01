/**
 * Application error taxonomy. Every server action funnels failures through these
 * codes so the client can map them to toasts / field errors without ever seeing
 * a raw exception. `AppError` is the only thing actions are allowed to throw on
 * the "expected failure" path; everything else is caught and mapped to INTERNAL.
 */
export type AppErrorCode =
  | "VALIDATION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_STATE"
  | "PROVIDER_UNAVAILABLE"
  | "SLOT_TAKEN"
  | "RATE_LIMITED"
  | "INTERNAL";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** Caller is not authenticated. Maps to HTTP 401 semantics. */
export class UnauthenticatedError extends AppError {
  constructor(message = "You must be signed in.") {
    super("UNAUTHENTICATED", message);
    this.name = "UnauthenticatedError";
  }
}

/**
 * Caller is authenticated but lacks capability/ownership. To avoid resource
 * enumeration we surface "not found" and "forbidden" with the same generic
 * message at the UI layer.
 */
export class ForbiddenError extends AppError {
  constructor(message = "You don't have permission to do that.") {
    super("FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super("NOT_FOUND", message);
    this.name = "NotFoundError";
  }
}

/** Illegal state-machine transition (e.g. accepting a canceled booking). */
export class InvalidStateError extends AppError {
  constructor(message = "That action isn't allowed in the current state.") {
    super("INVALID_STATE", message);
    this.name = "InvalidStateError";
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
