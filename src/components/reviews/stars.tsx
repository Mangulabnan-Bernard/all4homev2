import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only 5-star rating display. */
export function Stars({ rating, className }: { rating: number; className?: string }) {
  const filled = Math.round(rating);
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-4",
            n <= filled ? "fill-yellow-400 text-yellow-400" : "text-[var(--border)]",
          )}
        />
      ))}
    </div>
  );
}
