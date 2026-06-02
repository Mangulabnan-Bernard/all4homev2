import Link from "next/link";
import { MessageSquare } from "lucide-react";
import type { ConversationDTO } from "@/types/dto";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ConversationList({
  conversations,
  basePath,
}: {
  conversations: ConversationDTO[];
  basePath: string;
}) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
        <MessageSquare className="mx-auto size-8 text-[var(--muted-foreground)]" />
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">No conversations yet.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link
            href={`${basePath}/${c.id}`}
            className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--primary)]/40"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)]">
              {(c.otherName ?? "?").charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className={cn("truncate", c.unreadCount > 0 ? "font-semibold" : "font-medium")}>
                  {c.otherName ?? "Unknown user"}
                </span>
                <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                  {formatRelative(c.lastMessageAt)}
                </span>
              </span>
            </span>
            {c.unreadCount > 0 && (
              <span className="grid min-w-5 place-items-center rounded-full bg-[var(--primary)] px-1.5 text-xs font-semibold text-[var(--primary-foreground)]">
                {c.unreadCount}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
