"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { UserRole } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { updateUserRoleAction } from "@/actions/admin/update-user-role";
import { toggleUserActiveAction } from "@/actions/admin/toggle-user-active";

const ROLES: UserRole[] = ["CUSTOMER", "PROVIDER", "ADMIN"];
const SELECT_CLASS =
  "h-8 rounded-md border border-[var(--border)] bg-transparent px-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

export function UserRowActions({
  userId,
  role,
  isActive,
  isSelf,
}: {
  userId: string;
  role: UserRole;
  isActive: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<null | "role" | "active">(null);

  if (isSelf) {
    return <span className="text-xs text-[var(--muted-foreground)]">You</span>;
  }

  async function changeRole(next: UserRole) {
    if (next === role) return;
    setPending("role");
    const res = await updateUserRoleAction({ userId, role: next });
    setPending(null);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Role updated.");
    router.refresh();
  }

  async function toggleActive() {
    setPending("active");
    const res = await toggleUserActiveAction({ userId, isActive: !isActive });
    setPending(null);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(isActive ? "User deactivated." : "User activated.");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <select
        aria-label="Change role"
        className={SELECT_CLASS}
        value={role}
        disabled={pending !== null}
        onChange={(e) => changeRole(e.target.value as UserRole)}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <Button variant="outline" size="sm" disabled={pending !== null} onClick={toggleActive}>
        {pending === "active" ? <Loader2 className="size-4 animate-spin" /> : null}
        {isActive ? "Deactivate" : "Activate"}
      </Button>
    </div>
  );
}
