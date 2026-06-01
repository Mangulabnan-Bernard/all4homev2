"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { startConversationSchema } from "@/lib/validators/messages";
import { requireUser } from "@/lib/permissions/guard";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/**
 * Find-or-create the conversation between the caller and a recipient. The
 * participant pair is normalized (sorted) so (A,B) and (B,A) resolve to the same
 * row, backed by @@unique([participantAId, participantBId]).
 */
export async function startConversationAction(
  input: unknown,
): Promise<Result<{ conversationId: string }>> {
  try {
    const user = await requireUser();
    const parsed = startConversationSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Invalid request.", parsed.error.flatten().fieldErrors);
    }
    const { recipientId } = parsed.data;
    if (recipientId === user.id) return fail("VALIDATION", "You can't message yourself.");

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, isActive: true },
    });
    if (!recipient || !recipient.isActive) return fail("NOT_FOUND", "User not found.");

    const [participantAId, participantBId] =
      user.id < recipientId ? [user.id, recipientId] : [recipientId, user.id];

    const convo = await prisma.conversation.upsert({
      where: { participantAId_participantBId: { participantAId, participantBId } },
      update: {},
      create: { participantAId, participantBId },
      select: { id: true },
    });

    revalidatePath("/customer/messages");
    return ok({ conversationId: convo.id });
  } catch (e) {
    return failFrom(e);
  }
}
