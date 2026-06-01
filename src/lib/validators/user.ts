import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Name is too short.").max(80).optional(),
    phone: z.string().trim().max(30).optional(),
    address: z.string().trim().max(500).optional(),
    image: z.string().url("Provide a valid image URL.").optional(),
  })
  .strict();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const toggleDarkModeSchema = z.object({ darkMode: z.coerce.boolean() }).strict();
export type ToggleDarkModeInput = z.infer<typeof toggleDarkModeSchema>;
