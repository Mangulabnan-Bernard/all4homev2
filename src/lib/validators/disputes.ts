import { z } from "zod";

/** Admin moves an open dispute into review (OPEN -> UNDER_REVIEW). */
export const updateDisputeStatusSchema = z
  .object({ disputeId: z.string().min(1) })
  .strict();
export type UpdateDisputeStatusInput = z.infer<typeof updateDisputeStatusSchema>;

/**
 * Admin resolves a dispute. Outcome drives the payment + booking result:
 * - REFUND  -> dispute RESOLVED, payment REFUNDED, booking CLOSED
 * - RELEASE -> dispute RESOLVED, payment kept COMPLETED, booking CLOSED
 * - REJECT  -> dispute REJECTED, payment kept, booking CLOSED
 */
export const resolveDisputeSchema = z
  .object({
    disputeId: z.string().min(1),
    resolution: z.string().trim().min(5, "Explain the resolution.").max(2000),
    outcome: z.enum(["REFUND", "RELEASE", "REJECT"]),
  })
  .strict();
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>;
