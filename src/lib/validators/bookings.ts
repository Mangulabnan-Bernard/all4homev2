import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

/** Create a booking + simulated payment in one shot. */
export const createBookingSchema = z
  .object({
    serviceId: z.string().min(1, "Choose a service."),
    providerId: z.string().min(1), // ProviderProfile id
    scheduledAt: z.coerce.date(),
    address: z.string().trim().min(5, "Enter a service address.").max(500),
    notes: z.string().trim().max(1000).optional(),
    hours: z.coerce.number().min(1).max(12).default(1),
    paymentMethod: z.nativeEnum(PaymentMethod).default("SIMULATED_CARD"),
  })
  .strict()
  .refine((v) => v.scheduledAt.getTime() > Date.now(), {
    message: "Pick a time in the future.",
    path: ["scheduledAt"],
  });
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/** Identify a booking for a lifecycle action. */
export const bookingActionSchema = z.object({ bookingId: z.string().min(1) }).strict();
export type BookingActionInput = z.infer<typeof bookingActionSchema>;

export const cancelBookingSchema = z
  .object({ bookingId: z.string().min(1), reason: z.string().trim().max(500).optional() })
  .strict();
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

export const disputeBookingSchema = z
  .object({
    bookingId: z.string().min(1),
    reason: z.string().trim().min(10, "Describe the issue (10+ characters).").max(1000),
  })
  .strict();
export type DisputeBookingInput = z.infer<typeof disputeBookingSchema>;
