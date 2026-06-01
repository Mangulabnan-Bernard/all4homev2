"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { refundSchema } from "@/lib/validators/payments";
import { requireCan } from "@/lib/permissions/guard";
import { writeAuditLog } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/**
 * Admin refunds a booking's completed payment. Not a lifecycle transition, so it
 * is authorized by capability (`payment:refund`) rather than the booking
 * transition table; the payment mutation, customer notification, and audit entry
 * all commit atomically.
 */
export async function refundPaymentAction(input: unknown): Promise<Result<null>> {
  try {
    const admin = await requireCan("payment:refund");
    const parsed = refundSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const { bookingId } = parsed.data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, customerId: true, payment: { select: { id: true, status: true } } },
    });
    if (!booking || !booking.payment) return fail("NOT_FOUND", "Payment not found.");
    if (booking.payment.status !== "COMPLETED") {
      return fail("INVALID_STATE", "Only completed payments can be refunded.");
    }

    const paymentId = booking.payment.id;

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
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
      await writeAuditLog(
        {
          actorId: admin.id,
          action: "REFUND",
          entity: "Payment",
          entityId: paymentId,
          metadata: { reason: parsed.data.reason ?? null },
        },
        tx,
      );
    });

    revalidatePath("/admin/payments");
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
