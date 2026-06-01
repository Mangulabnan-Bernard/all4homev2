import { z } from "zod";

/** Admin refund of a booking's payment. */
export const refundSchema = z
  .object({ bookingId: z.string().min(1), reason: z.string().trim().max(500).optional() })
  .strict();
export type RefundInput = z.infer<typeof refundSchema>;
