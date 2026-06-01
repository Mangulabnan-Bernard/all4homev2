"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

/** Renders only the OAuth providers that are configured server-side. */
export function OAuthButtons({
  google,
  github,
  callbackUrl,
}: {
  google: boolean;
  github: boolean;
  callbackUrl?: string;
}) {
  if (!google && !github) return null;
  const target = callbackUrl || "/";
  return (
    <div className="space-y-2">
      {google && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => signIn("google", { callbackUrl: target })}
        >
          Continue with Google
        </Button>
      )}
      {github && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => signIn("github", { callbackUrl: target })}
        >
          Continue with GitHub
        </Button>
      )}
      <div className="flex items-center gap-3 py-1 text-xs text-[var(--muted-foreground)]">
        <span className="h-px flex-1 bg-[var(--border)]" />
        or
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>
    </div>
  );
}
