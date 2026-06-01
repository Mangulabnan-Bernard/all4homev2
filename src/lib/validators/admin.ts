import { z } from "zod";

export const toggleUserActiveSchema = z
  .object({ userId: z.string().min(1), isActive: z.coerce.boolean() })
  .strict();
export type ToggleUserActiveInput = z.infer<typeof toggleUserActiveSchema>;

export const updateUserRoleSchema = z
  .object({ userId: z.string().min(1), role: z.enum(["CUSTOMER", "PROVIDER", "ADMIN"]) })
  .strict();
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export const adminUsersQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    role: z.enum(["CUSTOMER", "PROVIDER", "ADMIN"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
  })
  .strict();
export type AdminUsersQueryInput = z.infer<typeof adminUsersQuerySchema>;
