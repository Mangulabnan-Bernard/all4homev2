"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart } from "lucide-react";

import { addFavoriteAction, removeFavoriteAction } from "@/actions/user/favorites";
import { cn } from "@/lib/utils";

/** Toggle a provider favorite. `providerUserId` is the provider's User id (what FavoriteProvider stores). */
export function FavoriteButton({
  providerUserId,
  initialFavorited,
  className,
}: {
  providerUserId: string;
  initialFavorited: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [fav, setFav] = React.useState(initialFavorited);
  const [pending, setPending] = React.useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !fav;
    setFav(next);
    setPending(true);
    const action = next ? addFavoriteAction : removeFavoriteAction;
    const res = await action({ providerId: providerUserId });
    setPending(false);
    if (!res.ok) {
      setFav(!next);
      toast.error(res.error.message);
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={fav}
      aria-label={fav ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "grid size-9 place-items-center rounded-full border border-[var(--border)] bg-[var(--background)] transition hover:bg-[var(--accent)] disabled:opacity-60",
        className,
      )}
    >
      <Heart className={cn("size-4", fav ? "fill-red-500 text-red-500" : "text-[var(--muted-foreground)]")} />
    </button>
  );
}
