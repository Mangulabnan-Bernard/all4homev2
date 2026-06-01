"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { bookingActionSchema } from "@/lib/validators/bookings";
import { requireUser } from "@/lib/permissions/guard";
import { assertTransition } from "@/lib/permissions/assert-transition";
import { writeAuditLog } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { InvalidStateError } from "@/lib/errors";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/**
 * Provider accepts a pending booking (PENDING -> ACCEPTED). Canonical lifecycle
 * pattern: load facts -> assertTransition (authorizes role + ownership + legal
 * transition) -> optimistic atomic update guarded by the loaded status.
 */
export async function acceptBookingAction(input: unknown): Promise<Result<null>> {
  try {
    const user = await requireUser();
    const parsed = bookingActionSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Invalid request.", parsed.error.flatten().fieldErrors);
    }
    const { bookingId } = parsed.data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true, customerId: true, provider: { select: { userId: true } } },
    });
    if (!booking) return fail("NOT_FOUND", "Booking not found.");

    assertTransition(
      { status: booking.status, customerId: booking.customerId, providerUserId: booking.provider.userId },
      "ACCEPTED",
      user,
    );

    await prisma.$transaction(async (tx) => {
      const res = await tx.booking.updateMany({
        where: { id: bookingId, status: booking.status },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });
      if (res.count === 0) throw new InvalidStateError("This booking can no longer be accepted.");
      await notify(
        {
          userId: booking.customerId,
          type: "BOOKING_ACCEPTED",
          title: "Booking accepted",
          message: "Your booking has been accepted.",
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
          metadata: { to: "ACCEPTED" },
        },
        tx,
      );
    });

    revalidatePath(`/provider/bookings/${bookingId}`);
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
