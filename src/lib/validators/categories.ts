import { z } from "zod";

export const categorySchema = z
  .object({
    name: z.string().trim().min(2, "Name is too short.").max(60),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only.")
      .min(2)
      .max(60),
    description: z.string().trim().max(500).optional(),
    icon: z.string().trim().max(60).optional(),
    isActive: z.coerce.boolean().default(true),
  })
  .strict();
export type CategoryInput = z.infer<typeof categorySchema>;

export const updateCategorySchema = categorySchema
  .partial()
  .extend({ id: z.string().min(1) })
  .strict();
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
