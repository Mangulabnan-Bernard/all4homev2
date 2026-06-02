"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { approveProviderAction, rejectProviderAction } from "@/actions/providers/admin";

export function ProviderApprovalActions({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<null | "approve" | "reject">(null);

  async function run(kind: "approve" | "reject") {
    if (kind === "reject" && !window.confirm("Reject this application?")) return;
    setPending(kind);
    const action = kind === "approve" ? approveProviderAction : rejectProviderAction;
    const res = await action({ id: profileId });
    setPending(null);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(kind === "approve" ? "Provider approved." : "Application rejected.");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending !== null} onClick={() => run("approve")}>
        {pending === "approve" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        Approve
      </Button>
      <Button size="sm" variant="outline" disabled={pending !== null} onClick={() => run("reject")}>
        {pending === "reject" ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
        Reject
      </Button>
    </div>
  );
}
