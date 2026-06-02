import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getConversations } from "@/features/messages/queries";
import { PageHeader } from "@/components/layout/page-header";
import { ConversationList } from "@/components/messages/conversation-list";
import { ROUTES } from "@/constants";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function ProviderMessagesPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);

  const conversations = await getConversations(userId);

  return (
    <div>
      <PageHeader title="Messages" description="Chat with your customers." />
      <ConversationList conversations={conversations} basePath={ROUTES.provider.messages} />
    </div>
  );
}
