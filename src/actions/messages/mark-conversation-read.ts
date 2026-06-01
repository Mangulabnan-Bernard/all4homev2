"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { conversationIdSchema } from "@/lib/validators/messages";
import { requireUser } from "@/lib/permissions/guard";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/**
 * Mark every message the OTHER participant sent in a conversation as read.
 * Caller must be a participant. Idempotent — only touches unread messages.
 */
export async function markConversationReadAction(input: unknown): Promise<Result<null>> {
  try {
    const user = await requireUser();
    const parsed = conversationIdSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Invalid conversation.", parsed.error.flatten().fieldErrors);
    }
    const { conversationId } = parsed.data;

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, participantAId: true, participantBId: true },
    });
    if (!conv) return fail("NOT_FOUND", "Conversation not found.");
    if (conv.participantAId !== user.id && conv.participantBId !== user.id) {
      return fail("FORBIDDEN", "Not your conversation.");
    }

    await prisma.message.updateMany({
      where: { conversationId, senderId: { not: user.id }, read: false },
      data: { read: true },
    });

    revalidatePath(`/customer/messages/${conversationId}`);
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
