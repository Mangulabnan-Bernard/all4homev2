import type { BookingStatus, PaymentStatus, UserRole, VerificationStatus } from "@prisma/client";

export * from "@/constants/routes";

export const ROLE_LABELS: Record<UserRole, string> = {
  CUSTOMER: "Customer",
  PROVIDER: "Provider",
  ADMIN: "Admin",
};

/** Tailwind classes for status badges. Keys map 1:1 to the Prisma enums. */
export const BOOKING_STATUS_META: Record<BookingStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  ACCEPTED: { label: "Accepted", className: "bg-blue-100 text-blue-800" },
  IN_PROGRESS: { label: "In progress", className: "bg-indigo-100 text-indigo-800" },
  COMPLETED: { label: "Completed", className: "bg-teal-100 text-teal-800" },
  CONFIRMED: { label: "Confirmed", className: "bg-green-100 text-green-800" },
  CLOSED: { label: "Closed", className: "bg-gray-100 text-gray-700" },
  CANCELED: { label: "Canceled", className: "bg-red-100 text-red-800" },
  DISPUTED: { label: "Disputed", className: "bg-rose-100 text-rose-800" },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  COMPLETED: { label: "Completed", className: "bg-green-100 text-green-800" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-800" },
  REFUNDED: { label: "Refunded", className: "bg-gray-100 text-gray-700" },
};

export const VERIFICATION_STATUS_META: Record<
  VerificationStatus,
  { label: string; className: string }
> = {
  PENDING: { label: "Pending review", className: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Approved", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
  SUSPENDED: { label: "Suspended", className: "bg-gray-100 text-gray-700" },
};

/** Days an unconfirmed/completed booking can still be disputed. */
export const DISPUTE_WINDOW_DAYS = 7;

/** Statuses that occupy a provider time slot (used by the availability calculator). */
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ["PENDING", "ACCEPTED", "IN_PROGRESS"];

export const APP_NAME = "All4Home";
