"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendMessageSchema } from "@/lib/validators/messages";
import { requireCan } from "@/lib/permissions/guard";
import { notify } from "@/lib/notify";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/**
 * Send a message in a conversation the caller participates in. Bumps
 * lastMessageAt and notifies the other participant — all in one transaction.
 */
export async function sendMessageAction(input: unknown): Promise<Result<{ id: string }>> {
  try {
    const user = await requireCan("message:send");
    const parsed = sendMessageSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Write a message.", parsed.error.flatten().fieldErrors);
    }
    const { conversationId, content } = parsed.data;

    const convo = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, participantAId: true, participantBId: true },
    });
    if (!convo) return fail("NOT_FOUND", "Conversation not found.");
    if (convo.participantAId !== user.id && convo.participantBId !== user.id) {
      return fail("FORBIDDEN", "You're not part of this conversation.");
    }
    const otherId = convo.participantAId === user.id ? convo.participantBId : convo.participantAId;

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: { conversationId, senderId: user.id, content },
        select: { id: true },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });
      await notify(
        {
          userId: otherId,
          type: "MESSAGE_RECEIVED",
          title: "New message",
          message: "You have a new message.",
          link: `/customer/messages/${conversationId}`,
        },
        tx,
      );
      return created;
    });

    revalidatePath(`/customer/messages/${conversationId}`);
    return ok({ id: message.id });
  } catch (e) {
    return failFrom(e);
  }
}
