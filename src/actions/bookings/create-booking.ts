"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createBookingSchema } from "@/lib/validators/bookings";
import { requireCan } from "@/lib/permissions/guard";
import { writeAuditLog } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { nextTransactionNumber } from "@/lib/payments/transaction-number";
import { AppError, NotFoundError } from "@/lib/errors";
import { ACTIVE_BOOKING_STATUSES } from "@/constants";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/**
 * Create a booking and its (simulated) payment atomically. The amount is
 * computed server-side (never trusted from the client); the payment is marked
 * COMPLETED immediately because the gateway is simulated. Serializable so the
 * slot check can't race; @@unique([providerId, scheduledAt]) is the backstop.
 */
export async function createBookingAction(
  input: unknown,
): Promise<Result<{ bookingId: string; transactionNumber: string }>> {
  try {
    const user = await requireCan("booking:create");
    const parsed = createBookingSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const data = parsed.data;

    const result = await prisma.$transaction(
      async (tx) => {
        const service = await tx.service.findUnique({
          where: { id: data.serviceId },
          include: {
            provider: {
              select: {
                id: true,
                userId: true,
                verificationStatus: true,
                user: { select: { isActive: true } },
              },
            },
          },
        });
        if (!service || !service.isActive || service.providerId !== data.providerId) {
          throw new NotFoundError("Service not found.");
        }
        const provider = service.provider;
        if (provider.verificationStatus !== "APPROVED" || !provider.user.isActive) {
          throw new AppError("PROVIDER_UNAVAILABLE", "This provider isn't available right now.");
        }

        const clash = await tx.booking.findFirst({
          where: {
            providerId: data.providerId,
            scheduledAt: data.scheduledAt,
            status: { in: ACTIVE_BOOKING_STATUSES },
          },
          select: { id: true },
        });
        if (clash) throw new AppError("SLOT_TAKEN", "That time slot is no longer available.");

        const amount = service.price.mul(data.hours);
        const transactionNumber = await nextTransactionNumber(tx);

        const booking = await tx.booking.create({
          data: {
            customerId: user.id,
            providerId: data.providerId,
            serviceId: data.serviceId,
            status: "PENDING",
            scheduledAt: data.scheduledAt,
            address: data.address,
            notes: data.notes,
            totalAmount: amount,
          },
          select: { id: true },
        });
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            transactionNumber,
            amount,
            status: "COMPLETED",
            paymentMethod: data.paymentMethod,
            paidAt: new Date(),
          },
        });
        await notify(
          {
            userId: provider.userId,
            type: "BOOKING_CREATED",
            title: "New booking",
            message: "You have a new booking request.",
            link: `/provider/bookings/${booking.id}`,
          },
          tx,
        );
        await notify(
          {
            userId: user.id,
            type: "PAYMENT_COMPLETED",
            title: "Payment confirmed",
            message: `Payment ${transactionNumber} was successful.`,
            link: `/customer/bookings/${booking.id}`,
          },
          tx,
        );
        await writeAuditLog(
          {
            actorId: user.id,
            action: "CREATE",
            entity: "Booking",
            entityId: booking.id,
            metadata: { transactionNumber },
          },
          tx,
        );
        return { bookingId: booking.id, transactionNumber };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    revalidatePath("/customer/bookings");
    return ok(result);
  } catch (e) {
    // Unique backstop on (providerId, scheduledAt) -> treat as a slot conflict.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("SLOT_TAKEN", "That time slot is no longer available.");
    }
    return failFrom(e);
  }
}
