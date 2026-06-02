"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { refundPaymentAction } from "@/actions/payments/refund-payment";

export function RefundButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function refund() {
    if (!window.confirm("Refund this payment? The customer will be notified.")) return;
    setPending(true);
    const res = await refundPaymentAction({ bookingId });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Payment refunded.");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={refund}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Refund
    </Button>
  );
}
