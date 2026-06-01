import { prisma } from "@/lib/prisma";
import type { ConversationDTO, MessageDTO } from "@/types/dto";

/** Conversations involving a user (most recent activity first), with unread counts. */
export async function getConversations(userId: string): Promise<ConversationDTO[]> {
  const rows = await prisma.conversation.findMany({
    where: { OR: [{ participantAId: userId }, { participantBId: userId }] },
    orderBy: { lastMessageAt: "desc" },
    include: {
      participantA: { select: { id: true, name: true, image: true } },
      participantB: { select: { id: true, name: true, image: true } },
      _count: {
        select: { messages: { where: { senderId: { not: userId }, read: false } } },
      },
    },
  });
  return rows.map((c) => {
    const other = c.participantAId === userId ? c.participantB : c.participantA;
    return {
      id: c.id,
      otherUserId: other.id,
      otherName: other.name,
      otherImage: other.image,
      lastMessageAt: c.lastMessageAt.toISOString(),
      unreadCount: c._count.messages,
    };
  });
}

/** Messages in a conversation (oldest first); null if it doesn't exist or the user isn't a participant. */
export async function getMessages(
  conversationId: string,
  userId: string,
): Promise<MessageDTO[] | null> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { participantAId: true, participantBId: true },
  });
  if (!conversation) return null;
  if (conversation.participantAId !== userId && conversation.participantBId !== userId) {
    return null;
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
  return messages.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    content: m.content,
    read: m.read,
    createdAt: m.createdAt.toISOString(),
  }));
}
