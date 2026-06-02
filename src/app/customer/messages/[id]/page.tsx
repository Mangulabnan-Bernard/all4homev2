import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { getConversations, getMessages } from "@/features/messages/queries";
import { MessageThread } from "@/components/messages/message-thread";
import { ROUTES } from "@/constants";

export const metadata: Metadata = { title: "Conversation" };
export const dynamic = "force-dynamic";

export default async function CustomerConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);

  const [messages, conversations] = await Promise.all([
    getMessages(id, userId),
    getConversations(userId),
  ]);
  if (messages === null) notFound();
  const meta = conversations.find((c) => c.id === id);

  return (
    <div>
      <Link
        href={ROUTES.customer.messages}
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="size-4" />
        All messages
      </Link>
      <h1 className="mb-4 text-xl font-bold tracking-tight">{meta?.otherName ?? "Conversation"}</h1>
      <MessageThread conversationId={id} messages={messages} currentUserId={userId} />
    </div>
  );
}
