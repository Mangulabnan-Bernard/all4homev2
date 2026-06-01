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
 * Customer confirms a completed booking (COMPLETED -> CONFIRMED). Canonical
 * lifecycle pattern: load facts -> assertTransition (authorizes role + ownership
 * + legal transition) -> optimistic atomic update guarded by the loaded status.
 */
export async function confirmCompletionAction(input: unknown): Promise<Result<null>> {
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
      "CONFIRMED",
      user,
    );

    await prisma.$transaction(async (tx) => {
      const res = await tx.booking.updateMany({
        where: { id: bookingId, status: booking.status },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
      });
      if (res.count === 0) throw new InvalidStateError("This booking can't be confirmed.");
      await notify(
        {
          userId: booking.provider.userId,
          type: "BOOKING_CONFIRMED",
          title: "Completion confirmed",
          message: "The customer confirmed the work.",
          link: `/provider/bookings/${bookingId}`,
        },
        tx,
      );
      await writeAuditLog(
        {
          actorId: user.id,
          action: "STATUS_CHANGE",
          entity: "Booking",
          entityId: bookingId,
          metadata: { to: "CONFIRMED" },
        },
        tx,
      );
    });

    revalidatePath(`/customer/bookings/${bookingId}`);
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
