import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/format";
import type { BookingDetailDTO, BookingListItemDTO } from "@/types/dto";

const LIST_INCLUDE = {
  service: { select: { title: true } },
  provider: { select: { user: { select: { name: true } } } },
  customer: { select: { name: true } },
} as const;

/** Bookings made by a customer (newest first). */
export async function getCustomerBookings(userId: string): Promise<BookingListItemDTO[]> {
  const rows = await prisma.booking.findMany({
    where: { customerId: userId },
    orderBy: { scheduledAt: "desc" },
    include: LIST_INCLUDE,
  });
  return rows.map((b) => ({
    id: b.id,
    status: b.status,
    scheduledAt: b.scheduledAt.toISOString(),
    address: b.address,
    totalAmount: decimalToNumber(b.totalAmount),
    serviceTitle: b.service.title,
    providerName: b.provider.user.name,
    customerName: b.customer.name,
    createdAt: b.createdAt.toISOString(),
  }));
}

/** Bookings assigned to a provider (by the provider's User id). */
export async function getProviderBookings(userId: string): Promise<BookingListItemDTO[]> {
  const rows = await prisma.booking.findMany({
    where: { provider: { userId } },
    orderBy: { scheduledAt: "desc" },
    include: LIST_INCLUDE,
  });
  return rows.map((b) => ({
    id: b.id,
    status: b.status,
    scheduledAt: b.scheduledAt.toISOString(),
    address: b.address,
    totalAmount: decimalToNumber(b.totalAmount),
    serviceTitle: b.service.title,
    providerName: b.provider.user.name,
    customerName: b.customer.name,
    createdAt: b.createdAt.toISOString(),
  }));
}

/** Full booking detail, ownership-checked (customer, assigned provider, or admin). */
export async function getBookingById(
  id: string,
  viewer: { id: string; role: UserRole },
): Promise<BookingDetailDTO | null> {
  const b = await prisma.booking.findUnique({
    where: { id },
    include: {
      service: { select: { title: true } },
      provider: { select: { id: true, userId: true, user: { select: { name: true } } } },
      customer: { select: { id: true, name: true } },
      payment: true,
      review: { select: { id: true } },
      dispute: { select: { status: true } },
    },
  });
  if (!b) return null;

  const allowed =
    viewer.role === "ADMIN" || b.customerId === viewer.id || b.provider.userId === viewer.id;
  if (!allowed) return null;

  return {
    id: b.id,
    status: b.status,
    scheduledAt: b.scheduledAt.toISOString(),
    address: b.address,
    totalAmount: decimalToNumber(b.totalAmount),
    serviceTitle: b.service.title,
    providerName: b.provider.user.name,
    customerName: b.customer.name,
    createdAt: b.createdAt.toISOString(),
    notes: b.notes,
    providerId: b.providerId,
    providerUserId: b.provider.userId,
    customerId: b.customerId,
    serviceId: b.serviceId,
    payment: b.payment
      ? {
          transactionNumber: b.payment.transactionNumber,
          amount: decimalToNumber(b.payment.amount),
          status: b.payment.status,
          method: b.payment.paymentMethod,
          paidAt: b.payment.paidAt ? b.payment.paidAt.toISOString() : null,
        }
      : null,
    hasReview: Boolean(b.review),
    disputeStatus: b.dispute?.status ?? null,
  };
}
