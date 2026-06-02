"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { DisputeStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateDisputeStatusAction } from "@/actions/disputes/update-dispute-status";
import { resolveDisputeAction } from "@/actions/disputes/resolve-dispute";

const OUTCOMES = [
  { value: "REFUND", label: "Refund customer" },
  { value: "RELEASE", label: "Release to provider" },
  { value: "REJECT", label: "Reject claim" },
] as const;

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

export function DisputeActions({ disputeId, status }: { disputeId: string; status: DisputeStatus }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<null | "review" | "resolve">(null);
  const [open, setOpen] = React.useState(false);
  const [resolution, setResolution] = React.useState("");
  const [outcome, setOutcome] = React.useState<(typeof OUTCOMES)[number]["value"]>("REFUND");

  const settled = status === "RESOLVED" || status === "REJECTED" || status === "CLOSED";
  if (settled) {
    return <span className="text-xs text-[var(--muted-foreground)]">Settled</span>;
  }

  async function moveToReview() {
    setPending("review");
    const res = await updateDisputeStatusAction({ disputeId });
    setPending(null);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Moved to review.");
    router.refresh();
  }

  async function resolve() {
    if (resolution.trim().length < 5) {
      toast.error("Explain the resolution (5+ characters).");
      return;
    }
    setPending("resolve");
    const res = await resolveDisputeAction({ disputeId, resolution: resolution.trim(), outcome });
    setPending(null);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Dispute resolved.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status === "OPEN" && (
          <Button size="sm" variant="outline" disabled={pending !== null} onClick={moveToReview}>
            {pending === "review" ? <Loader2 className="size-4 animate-spin" /> : null}
            Move to review
          </Button>
        )}
        {!open && (
          <Button size="sm" disabled={pending !== null} onClick={() => setOpen(true)}>
            Resolve…
          </Button>
        )}
      </div>

      {open && (
        <div className="space-y-3 rounded-xl border border-[var(--border)] p-4">
          <div className="space-y-1.5">
            <Label htmlFor={`outcome-${disputeId}`}>Outcome</Label>
            <select
              id={`outcome-${disputeId}`}
              className={SELECT_CLASS}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as typeof outcome)}
            >
              {OUTCOMES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`resolution-${disputeId}`}>Resolution note</Label>
            <Textarea
              id={`resolution-${disputeId}`}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Explain the decision (shared with both parties)…"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={pending !== null} onClick={resolve}>
              {pending === "resolve" ? <Loader2 className="size-4 animate-spin" /> : null}
              Submit resolution
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending !== null}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
