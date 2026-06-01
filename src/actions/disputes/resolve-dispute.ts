"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { resolveDisputeSchema } from "@/lib/validators/disputes";
import { requireCan } from "@/lib/permissions/guard";
import { writeAuditLog } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/**
 * Admin resolves a dispute. Outcome drives the payout: REFUND refunds the
 * customer, RELEASE keeps the payment, REJECT rejects the claim. The booking is
 * CLOSED and both parties are notified — all in one transaction.
 */
export async function resolveDisputeAction(input: unknown): Promise<Result<null>> {
  try {
    const admin = await requireCan("dispute:resolve");
    const parsed = resolveDisputeSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const { disputeId, resolution, outcome } = parsed.data;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      select: {
        id: true,
        status: true,
        bookingId: true,
        booking: {
          select: {
            customerId: true,
            provider: { select: { userId: true } },
            payment: { select: { id: true, status: true } },
          },
        },
      },
    });
    if (!dispute) return fail("NOT_FOUND", "Dispute not found.");
    if (dispute.status === "RESOLVED" || dispute.status === "REJECTED" || dispute.status === "CLOSED") {
      return fail("INVALID_STATE", "This dispute has already been resolved.");
    }

    const disputeStatus = outcome === "REJECT" ? "REJECTED" : "RESOLVED";
    const shouldRefund = outcome === "REFUND";
    const { customerId } = dispute.booking;
    const providerUserId = dispute.booking.provider.userId;

    await prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id: disputeId },
        data: { status: disputeStatus, resolution, resolvedById: admin.id, resolvedAt: new Date() },
      });
      await tx.booking.update({ where: { id: dispute.bookingId }, data: { status: "CLOSED" } });

      if (shouldRefund && dispute.booking.payment && dispute.booking.payment.status === "COMPLETED") {
        await tx.payment.update({
          where: { id: dispute.booking.payment.id },
          data: { status: "REFUNDED" },
        });
        await notify(
          {
            userId: customerId,
            type: "PAYMENT_REFUNDED",
            title: "Payment refunded",
            message: "Your payment was refunded after dispute resolution.",
            link: `/customer/bookings/${dispute.bookingId}`,
          },
          tx,
        );
      }

      await notify(
        {
          userId: customerId,
          type: "DISPUTE_RESOLVED",
          title: "Dispute resolved",
          message: resolution,
          link: `/customer/bookings/${dispute.bookingId}`,
        },
        tx,
      );
      await notify(
        {
          userId: providerUserId,
          type: "DISPUTE_RESOLVED",
          title: "Dispute resolved",
          message: resolution,
          link: `/provider/bookings/${dispute.bookingId}`,
        },
        tx,
      );
      await writeAuditLog(
        {
          actorId: admin.id,
          action: "STATUS_CHANGE",
          entity: "Dispute",
          entityId: disputeId,
          metadata: { outcome, refunded: shouldRefund },
        },
        tx,
      );
    });

    revalidatePath("/admin/disputes");
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
