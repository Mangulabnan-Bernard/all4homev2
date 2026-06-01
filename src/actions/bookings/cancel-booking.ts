"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { cancelBookingSchema } from "@/lib/validators/bookings";
import { requireUser } from "@/lib/permissions/guard";
import { assertTransition } from "@/lib/permissions/assert-transition";
import { writeAuditLog } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { InvalidStateError } from "@/lib/errors";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/**
 * Cancel a booking that hasn't started (PENDING/ACCEPTED -> CANCELED) and refund
 * its (simulated) payment, atomically. Either party or an admin may cancel.
 */
export async function cancelBookingAction(input: unknown): Promise<Result<null>> {
  try {
    const user = await requireUser();
    const parsed = cancelBookingSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Invalid request.", parsed.error.flatten().fieldErrors);
    }
    const { bookingId, reason } = parsed.data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        customerId: true,
        provider: { select: { userId: true } },
        payment: { select: { id: true, status: true } },
      },
    });
    if (!booking) return fail("NOT_FOUND", "Booking not found.");

    assertTransition(
      { status: booking.status, customerId: booking.customerId, providerUserId: booking.provider.userId },
      "CANCELED",
      user,
    );

    const counterpartyId =
      user.id === booking.customerId ? booking.provider.userId : booking.customerId;

    await prisma.$transaction(async (tx) => {
      const res = await tx.booking.updateMany({
        where: { id: bookingId, status: booking.status },
        data: { status: "CANCELED", canceledAt: new Date() },
      });
      if (res.count === 0) throw new InvalidStateError("This booking can no longer be canceled.");

      const refunded = booking.payment && booking.payment.status === "COMPLETED";
      if (refunded) {
        await tx.payment.update({
          where: { id: booking.payment!.id },
          data: { status: "REFUNDED" },
        });
        await notify(
          {
            userId: booking.customerId,
            type: "PAYMENT_REFUNDED",
            title: "Payment refunded",
            message: "Your payment has been refunded.",
            link: `/customer/bookings/${bookingId}`,
          },
          tx,
        );
      }
      await notify(
        {
          userId: counterpartyId,
          type: "BOOKING_CANCELED",
          title: "Booking canceled",
          message: "A booking was canceled.",
          link: `/customer/bookings/${bookingId}`,
        },
        tx,
      );
      await writeAuditLog(
        {
          actorId: user.id,
          action: "STATUS_CHANGE",
          entity: "Booking",
          entityId: bookingId,
          metadata: { to: "CANCELED", refunded: Boolean(refunded), reason: reason ?? null },
        },
        tx,
      );
    });

    revalidatePath(`/customer/bookings/${bookingId}`);
    revalidatePath(`/provider/bookings/${bookingId}`);
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
