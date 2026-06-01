import { prisma } from "@/lib/prisma";
import type { NotificationType, Prisma } from "@prisma/client";

/**
 * Persist a notification. Pass the transaction client (`tx`) so it commits
 * atomically with the event that triggered it.
 */
export async function notify(
  input: { userId: string; type: NotificationType; title: string; message: string; link?: string },
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx ?? prisma;
  await client.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
    },
  });
}
