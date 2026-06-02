"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Play, ShieldAlert, ThumbsUp, X } from "lucide-react";
import type { BookingStatus, UserRole } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Result } from "@/lib/result";
import { acceptBookingAction } from "@/actions/bookings/accept-booking";
import { startWorkAction } from "@/actions/bookings/start-work";
import { completeBookingAction } from "@/actions/bookings/complete-booking";
import { confirmCompletionAction } from "@/actions/bookings/confirm-completion";
import { cancelBookingAction } from "@/actions/bookings/cancel-booking";
import { disputeBookingAction } from "@/actions/bookings/dispute-booking";

/**
 * Lifecycle buttons for a booking, gated by (role, status) to mirror the server
 * state machine. Each button calls its server action, surfaces the Result via a
 * toast, and refreshes the route on success. Disputes require a reason (10+).
 */
export function BookingActions({
  bookingId,
  status,
  role,
}: {
  bookingId: string;
  status: BookingStatus;
  role: UserRole;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);
  const [disputeOpen, setDisputeOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const busy = pending !== null;

  async function run(key: string, fn: () => Promise<Result<null>>, success: string) {
    setPending(key);
    try {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success(success);
      setDisputeOpen(false);
      setReason("");
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  const isCustomer = role === "CUSTOMER";
  const isProvider = role === "PROVIDER";
  const isAdmin = role === "ADMIN";
  const staff = isProvider || isAdmin;

  const canAccept = staff && status === "PENDING";
  const canStart = staff && status === "ACCEPTED";
  const canComplete = staff && status === "IN_PROGRESS";
  const canConfirm = (isCustomer || isAdmin) && status === "COMPLETED";
  const canCancel = status === "PENDING" || status === "ACCEPTED";
  const canDispute =
    (status === "COMPLETED" && (isCustomer || isAdmin)) ||
    (status === "CONFIRMED" && (isCustomer || isProvider || isAdmin));

  if (!canAccept && !canStart && !canComplete && !canConfirm && !canCancel && !canDispute) {
    return null;
  }

  return (
    <div className="space-y-3 border-t border-[var(--border)] pt-5">
      <div className="flex flex-wrap gap-2">
        {canAccept && (
          <Button
            disabled={busy}
            onClick={() => run("accept", () => acceptBookingAction({ bookingId }), "Booking accepted.")}
          >
            {pending === "accept" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Accept
          </Button>
        )}
        {canStart && (
          <Button
            disabled={busy}
            onClick={() => run("start", () => startWorkAction({ bookingId }), "Work started.")}
          >
            {pending === "start" ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            Start work
          </Button>
        )}
        {canComplete && (
          <Button
            disabled={busy}
            onClick={() => run("complete", () => completeBookingAction({ bookingId }), "Marked complete.")}
          >
            {pending === "complete" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Mark complete
          </Button>
        )}
        {canConfirm && (
          <Button
            disabled={busy}
            onClick={() =>
              run("confirm", () => confirmCompletionAction({ bookingId }), "Completion confirmed.")
            }
          >
            {pending === "confirm" ? <Loader2 className="size-4 animate-spin" /> : <ThumbsUp className="size-4" />}
            Confirm completion
          </Button>
        )}
        {canCancel && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              if (!window.confirm("Cancel this booking? Any payment will be refunded.")) return;
              run("cancel", () => cancelBookingAction({ bookingId }), "Booking canceled.");
            }}
          >
            {pending === "cancel" ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
            Cancel
          </Button>
        )}
        {canDispute && !disputeOpen && (
          <Button variant="outline" disabled={busy} onClick={() => setDisputeOpen(true)}>
            <ShieldAlert className="size-4" />
            Open dispute
          </Button>
        )}
      </div>

      {canDispute && disputeOpen && (
        <div className="rounded-xl border border-[var(--border)] p-4">
          <label htmlFor="dispute-reason" className="text-sm font-medium">
            What went wrong?
          </label>
          <Textarea
            id="dispute-reason"
            className="mt-2"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe the issue (at least 10 characters)…"
            disabled={busy}
          />
          <div className="mt-3 flex gap-2">
            <Button
              disabled={busy || reason.trim().length < 10}
              onClick={() =>
                run("dispute", () => disputeBookingAction({ bookingId, reason }), "Dispute opened.")
              }
            >
              {pending === "dispute" ? <Loader2 className="size-4 animate-spin" /> : null}
              Submit dispute
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                setDisputeOpen(false);
                setReason("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
