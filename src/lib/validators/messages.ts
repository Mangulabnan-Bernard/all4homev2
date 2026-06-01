import { z } from "zod";

export const startConversationSchema = z
  .object({ recipientId: z.string().min(1) })
  .strict();
export type StartConversationInput = z.infer<typeof startConversationSchema>;

export const sendMessageSchema = z
  .object({
    conversationId: z.string().min(1),
    content: z.string().trim().min(1, "Write a message.").max(4000),
  })
  .strict();
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const conversationIdSchema = z.object({ conversationId: z.string().min(1) }).strict();
export type ConversationIdInput = z.infer<typeof conversationIdSchema>;
