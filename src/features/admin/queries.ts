import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/format";
import type {
  AdminPaymentDTO,
  AdminUserDTO,
  AnalyticsDTO,
  AuditLogDTO,
  BookingListItemDTO,
} from "@/types/dto";
import type { AdminUsersQueryInput } from "@/lib/validators/admin";

const PAGE_SIZE = 20;

/** Paginated user directory with optional role + text filter. */
export async function getAllUsers(
  input: AdminUsersQueryInput,
): Promise<{ items: AdminUserDTO[]; page: number; hasMore: boolean }> {
  const where: Prisma.UserWhereInput = {};
  if (input.role) where.role = input.role;
  if (input.q) {
    where.OR = [{ name: { contains: input.q } }, { email: { contains: input.q } }];
  }
  const rows = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (input.page - 1) * PAGE_SIZE,
    take: PAGE_SIZE + 1,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
    },
  });
  const hasMore = rows.length > PAGE_SIZE;
  const items: AdminUserDTO[] = rows.slice(0, PAGE_SIZE).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    isVerified: u.isVerified,
    createdAt: u.createdAt.toISOString(),
  }));
  return { items, page: input.page, hasMore };
}

/** All bookings, newest first (capped). */
export async function getAllBookings(): Promise<BookingListItemDTO[]> {
  const rows = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      service: { select: { title: true } },
      provider: { select: { user: { select: { name: true } } } },
      customer: { select: { name: true } },
    },
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

/** Payment ledger for reconciliation (capped). */
export async function getAdminPayments(): Promise<AdminPaymentDTO[]> {
  const rows = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { booking: { select: { id: true, customer: { select: { name: true } } } } },
  });
  return rows.map((p) => ({
    id: p.id,
    transactionNumber: p.transactionNumber,
    amount: decimalToNumber(p.amount),
    status: p.status,
    method: p.paymentMethod,
    bookingId: p.bookingId,
    customerName: p.booking.customer.name,
    createdAt: p.createdAt.toISOString(),
  }));
}

/** Recent audit trail (capped). */
export async function getAuditLogs(): Promise<AuditLogDTO[]> {
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: { select: { name: true } } },
  });
  return rows.map((a) => ({
    id: a.id,
    action: a.action,
    entity: a.entity,
    entityId: a.entityId,
    actorName: a.actor?.name ?? null,
    createdAt: a.createdAt.toISOString(),
  }));
}

/** Headline analytics for the admin dashboard. */
export async function getAnalytics(): Promise<AnalyticsDTO> {
  const [totalUsers, totalProviders, pendingProviders, totalBookings, revenue, byStatus] =
    await Promise.all([
      prisma.user.count(),
      prisma.providerProfile.count({ where: { verificationStatus: "APPROVED" } }),
      prisma.providerProfile.count({ where: { verificationStatus: "PENDING" } }),
      prisma.booking.count(),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED" } }),
      prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

  return {
    totalUsers,
    totalProviders,
    pendingProviders,
    totalBookings,
    totalRevenue: revenue._sum.amount ? decimalToNumber(revenue._sum.amount) : 0,
    bookingsByStatus: byStatus.map((b) => ({ status: b.status, count: b._count._all })),
  };
}
