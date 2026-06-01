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
 * Provider marks an in-progress booking as complete (IN_PROGRESS -> COMPLETED).
 * Canonical lifecycle pattern: load facts -> assertTransition (authorizes role +
 * ownership + legal transition) -> optimistic atomic update guarded by the
 * loaded status.
 */
export async function completeBookingAction(input: unknown): Promise<Result<null>> {
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
      "COMPLETED",
      user,
    );

    await prisma.$transaction(async (tx) => {
      const res = await tx.booking.updateMany({
        where: { id: bookingId, status: booking.status },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      if (res.count === 0) throw new InvalidStateError("This booking can't be completed.");
      await notify(
        {
          userId: booking.customerId,
          type: "BOOKING_COMPLETED",
          title: "Work completed",
          message: "Your provider marked the work complete — please confirm.",
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
          metadata: { to: "COMPLETED" },
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
