"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { disputeBookingSchema } from "@/lib/validators/bookings";
import { requireUser } from "@/lib/permissions/guard";
import { assertTransition } from "@/lib/permissions/assert-transition";
import { writeAuditLog } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { InvalidStateError } from "@/lib/errors";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/**
 * Open a dispute on a COMPLETED/CONFIRMED booking (-> DISPUTED) and create the
 * Dispute record, atomically. Notifies the counterparty; an admin resolves it later.
 */
export async function disputeBookingAction(input: unknown): Promise<Result<null>> {
  try {
    const user = await requireUser();
    const parsed = disputeBookingSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const { bookingId, reason } = parsed.data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true, customerId: true, provider: { select: { userId: true } } },
    });
    if (!booking) return fail("NOT_FOUND", "Booking not found.");

    assertTransition(
      { status: booking.status, customerId: booking.customerId, providerUserId: booking.provider.userId },
      "DISPUTED",
      user,
    );

    const counterpartyId =
      user.id === booking.customerId ? booking.provider.userId : booking.customerId;

    await prisma.$transaction(async (tx) => {
      const res = await tx.booking.updateMany({
        where: { id: bookingId, status: booking.status },
        data: { status: "DISPUTED" },
      });
      if (res.count === 0) throw new InvalidStateError("This booking can no longer be disputed.");

      await tx.dispute.create({
        data: { bookingId, raisedById: user.id, reason, status: "OPEN" },
      });
      await notify(
        {
          userId: counterpartyId,
          type: "BOOKING_DISPUTED",
          title: "Dispute opened",
          message: "A dispute was opened on a booking.",
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
          metadata: { to: "DISPUTED" },
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
