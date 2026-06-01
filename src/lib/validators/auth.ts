import { z } from "zod";

/** Shared field schemas. Email is normalized (trim + lowercase) at the boundary. */
const email = z.string().trim().toLowerCase().email("Enter a valid email address.");
const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password is too long."); // bcrypt truncates beyond 72 bytes

export const loginSchema = z
  .object({
    email,
    password: z.string().min(1, "Password is required."),
    remember: z.coerce.boolean().optional().default(false),
  })
  .strict();
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Tell us your name.").max(80),
    email,
    password: strongPassword,
    // ADMIN can never be self-assigned at registration.
    role: z.enum(["CUSTOMER", "PROVIDER"]).default("CUSTOMER"),
  })
  .strict();
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email }).strict();
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required."),
    password: strongPassword,
  })
  .strict();
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: strongPassword,
  })
  .strict();
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
