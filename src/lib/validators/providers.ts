import { z } from "zod";
import { DocumentType } from "@prisma/client";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Initial provider application (a CUSTOMER applies; stays CUSTOMER until approved). */
export const providerApplicationSchema = z
  .object({
    categoryId: z.string().min(1, "Choose a category."),
    bio: z.string().trim().min(20, "Tell customers about yourself (20+ characters).").max(1000),
    hourlyRate: z.coerce.number().min(0, "Rate can't be negative.").max(100000),
    experienceYears: z.coerce.number().int().min(0).max(80).default(0),
    serviceRadiusKm: z.coerce.number().int().min(1).max(200).default(10),
  })
  .strict();
export type ProviderApplicationInput = z.infer<typeof providerApplicationSchema>;

/** Edit an existing profile (all fields optional). */
export const providerProfileSchema = z
  .object({
    categoryId: z.string().min(1).optional(),
    bio: z.string().trim().max(1000).optional(),
    description: z.string().trim().max(4000).optional(),
    hourlyRate: z.coerce.number().min(0).max(100000).optional(),
    experienceYears: z.coerce.number().int().min(0).max(80).optional(),
    serviceRadiusKm: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict();
export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;

/** Create (no id) or update (with id) a service offering. */
export const serviceSchema = z
  .object({
    id: z.string().min(1).optional(),
    categoryId: z.string().min(1, "Choose a category."),
    title: z.string().trim().min(3, "Give it a clear title.").max(120),
    description: z.string().trim().max(2000).optional(),
    price: z.coerce.number().min(0).max(100000),
    durationMin: z.coerce.number().int().min(15).max(1440).default(60),
    isActive: z.coerce.boolean().default(true),
  })
  .strict();
export type ServiceInput = z.infer<typeof serviceSchema>;

export const availabilitySchema = z
  .object({
    slots: z
      .array(
        z.object({
          dayOfWeek: z.coerce.number().int().min(0).max(6),
          startTime: z.string().regex(HHMM, "Use HH:mm."),
          endTime: z.string().regex(HHMM, "Use HH:mm."),
        }),
      )
      .max(50),
  })
  .strict()
  .refine((v) => v.slots.every((s) => s.startTime < s.endTime), {
    message: "Start time must be before end time.",
    path: ["slots"],
  });
export type AvailabilityInput = z.infer<typeof availabilitySchema>;

export const documentSchema = z
  .object({
    type: z.nativeEnum(DocumentType),
    url: z.string().url("Provide a valid file URL."),
  })
  .strict();
export type DocumentInput = z.infer<typeof documentSchema>;

/** Public provider search/filter params. */
export const searchProvidersSchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    categorySlug: z.string().trim().optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sort: z.enum(["rating", "price-asc", "price-desc", "newest"]).default("rating"),
    page: z.coerce.number().int().min(1).default(1),
  })
  .strict();
export type SearchProvidersInput = z.infer<typeof searchProvidersSchema>;
