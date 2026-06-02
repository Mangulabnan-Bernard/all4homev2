"use client";

import * as React from "react";
import { toast } from "sonner";

import { toggleDarkModeAction } from "@/actions/user/toggle-dark-mode";
import { cn } from "@/lib/utils";

/**
 * Persists the user's dark-mode preference and applies the `.dark` class on
 * <html> live (globals.css drives theming off that class). Reflects the saved
 * preference on mount.
 */
export function DarkModeToggle({ initial }: { initial: boolean }) {
  const [dark, setDark] = React.useState(initial);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  async function toggle() {
    const next = !dark;
    setDark(next); // optimistic
    setPending(true);
    const res = await toggleDarkModeAction({ darkMode: next });
    setPending(false);
    if (!res.ok) {
      setDark(!next); // revert
      toast.error(res.error.message);
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Toggle dark mode"
      disabled={pending}
      onClick={toggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-60",
        dark ? "bg-[var(--primary)]" : "bg-[var(--border)]",
      )}
    >
      <span
        className={cn(
          "inline-block size-5 transform rounded-full bg-white shadow transition",
          dark ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
