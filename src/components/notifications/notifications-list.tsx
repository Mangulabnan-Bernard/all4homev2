"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, Check, Loader2 } from "lucide-react";
import type { NotificationDTO } from "@/types/dto";

import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { markNotificationReadAction } from "@/actions/notifications/mark-as-read";
import { markAllNotificationsReadAction } from "@/actions/notifications/mark-all-read";

/** Notification feed with mark-all-read and click-to-read (then follow the link). */
export function NotificationsList({ items }: { items: NotificationDTO[] }) {
  const router = useRouter();
  const [marking, setMarking] = React.useState(false);
  const hasUnread = items.some((n) => !n.read);

  async function onItemClick(n: NotificationDTO) {
    if (!n.read) await markNotificationReadAction({ id: n.id });
    if (n.link) router.push(n.link);
    else router.refresh();
  }

  async function markAll() {
    setMarking(true);
    try {
      const res = await markAllNotificationsReadAction();
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      router.refresh();
    } finally {
      setMarking(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
        <Bell className="mx-auto size-8 text-[var(--muted-foreground)]" />
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">You&apos;re all caught up.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" disabled={!hasUnread || marking} onClick={markAll}>
          {marking ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Mark all read
        </Button>
      </div>
      <ul className="space-y-2">
        {items.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => onItemClick(n)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition hover:border-[var(--primary)]/40",
                n.read
                  ? "border-[var(--border)] bg-[var(--card)]"
                  : "border-[var(--primary)]/30 bg-[var(--primary)]/5",
              )}
            >
              <span
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  n.read ? "bg-transparent" : "bg-[var(--primary)]",
                )}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className={cn("truncate", n.read ? "font-medium" : "font-semibold")}>
                    {n.title}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                    {formatRelative(n.createdAt)}
                  </span>
                </span>
                <span className="mt-0.5 block text-sm text-[var(--muted-foreground)]">
                  {n.message}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
