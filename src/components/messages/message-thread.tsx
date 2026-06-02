"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import type { MessageDTO } from "@/types/dto";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { sendMessageAction } from "@/actions/messages/send-message";
import { markConversationReadAction } from "@/actions/messages/mark-conversation-read";

export function MessageThread({
  conversationId,
  messages,
  currentUserId,
}: {
  conversationId: string;
  messages: MessageDTO[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [content, setContent] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  // Mark the other party's messages as read when the thread is opened.
  React.useEffect(() => {
    void markConversationReadAction({ conversationId });
  }, [conversationId]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send() {
    const text = content.trim();
    if (!text) return;
    setSending(true);
    const res = await sendMessageAction({ conversationId, content: text });
    setSending(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    setContent("");
    router.refresh();
  }

  return (
    <div className="flex h-[70vh] flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        {messages.length === 0 ? (
          <p className="grid h-full place-items-center text-sm text-[var(--muted-foreground)]">
            No messages yet — say hello.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                    mine ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--accent)]",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p
                    className={cn(
                      "mt-1 text-[0.625rem]",
                      mine ? "text-[var(--primary-foreground)]/70" : "text-[var(--muted-foreground)]",
                    )}
                  >
                    {formatRelative(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex items-end gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Type a message…"
          rows={2}
          className="flex-1"
          disabled={sending}
        />
        <Button onClick={send} disabled={sending || !content.trim()} aria-label="Send message">
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
