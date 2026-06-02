"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";

import { createReviewAction } from "@/actions/reviews/create-review";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    if (rating < 1) {
      toast.error("Pick a rating from 1 to 5 stars.");
      return;
    }
    setSubmitting(true);
    const res = await createReviewAction({
      bookingId,
      rating,
      comment: comment.trim() || undefined,
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Thanks for your review!");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <h2 className="font-semibold">Leave a review</h2>
      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="p-0.5"
          >
            <Star
              className={cn(
                "size-6 transition",
                n <= (hover || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-[var(--border)]",
              )}
            />
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        <Label htmlFor="review-comment">Comment (optional)</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How was the service?"
          disabled={submitting}
        />
      </div>
      <Button className="mt-3" size="sm" onClick={submit} disabled={submitting}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Submit review
      </Button>
    </div>
  );
}
