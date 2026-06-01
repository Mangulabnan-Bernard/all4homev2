import { headers } from "next/headers";
import { ForbiddenError } from "@/lib/errors";

/**
 * CSRF defense for mutating Route Handlers (`/api/*`). Server Actions are
 * already covered by Next's built-in Origin/Host check + SameSite=Lax cookies;
 * this guards the few JSON endpoints that change state. Compares the request
 * Origin against the configured app URL allow-list.
 */
export async function assertSameOrigin(): Promise<void> {
  const h = await headers();
  const origin = h.get("origin");
  // Same-origin GETs and some same-origin POSTs omit Origin; fall back to Host.
  const host = h.get("host");

  const allowed = new Set<string>();
  for (const url of [process.env.AUTH_URL, process.env.NEXT_PUBLIC_APP_URL]) {
    if (url) {
      try {
        allowed.add(new URL(url).host);
      } catch {
        /* ignore malformed env */
      }
    }
  }
  if (host) allowed.add(host);

  if (origin) {
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      throw new ForbiddenError("Invalid request origin.");
    }
    if (!allowed.has(originHost)) {
      throw new ForbiddenError("Cross-origin request rejected.");
    }
  }
}
