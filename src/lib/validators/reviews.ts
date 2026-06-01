import { z } from "zod";

export const createReviewSchema = z
  .object({
    bookingId: z.string().min(1),
    rating: z.coerce.number().int().min(1, "Pick 1–5 stars.").max(5),
    comment: z.string().trim().max(2000).optional(),
  })
  .strict();
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = z
  .object({
    id: z.string().min(1),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional(),
  })
  .strict();
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
