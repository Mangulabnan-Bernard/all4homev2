import { AppError, type AppErrorCode, isAppError } from "@/lib/errors";

/**
 * Uniform action contract. Every server action returns a `Result<T>` discriminated
 * union and NEVER throws to the client. Success carries `data`; failure carries a
 * machine-readable `code`, a human `message`, and optional `fieldErrors` for forms.
 */
export type Result<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: AppErrorCode;
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail<T = never>(
  code: AppErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>,
): Result<T> {
  return { ok: false, error: { code, message, fieldErrors } };
}

/** Map any thrown value to a `Result`. AppErrors keep their code; anything else is INTERNAL. */
export function failFrom<T = never>(e: unknown): Result<T> {
  if (isAppError(e)) {
    return fail<T>(e.code, e.message, e.fieldErrors);
  }
  // Don't leak internal error details to the client.
  if (process.env.NODE_ENV === "development") {
    console.error("[action] unexpected error:", e);
  }
  return fail<T>("INTERNAL", "Something went wrong. Please try again.");
}

export { AppError };
