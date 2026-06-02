"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteReviewAction } from "@/actions/reviews/delete-review";

export function DeleteReviewButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function remove() {
    if (!window.confirm("Delete this review? This can't be undone.")) return;
    setPending(true);
    const res = await deleteReviewAction({ id: reviewId });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Review deleted.");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" aria-label="Delete review" disabled={pending} onClick={remove}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </Button>
  );
}
