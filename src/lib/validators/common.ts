import { z } from "zod";

/** A non-empty id (cuid). */
export const id = z.string().min(1, "Required.");

export const idSchema = z.object({ id }).strict();
export type IdInput = z.infer<typeof idSchema>;

export const paginationSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(12),
  })
  .strict();
export type PaginationInput = z.infer<typeof paginationSchema>;
