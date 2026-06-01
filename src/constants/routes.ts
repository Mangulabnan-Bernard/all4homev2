import type { UserRole } from "@prisma/client";

/** Centralized route paths. Route groups like (customer) do NOT appear in URLs. */
export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  forbidden: "/403",

  customer: {
    dashboard: "/customer/dashboard",
    search: "/customer/search",
    providers: "/customer/providers",
    provider: (id: string) => `/customer/providers/${id}`,
    book: (serviceId: string) => `/customer/book/${serviceId}`,
    bookings: "/customer/bookings",
    booking: (id: string) => `/customer/bookings/${id}`,
    favorites: "/customer/favorites",
    reviews: "/customer/reviews",
    messages: "/customer/messages",
    notifications: "/customer/notifications",
    profile: "/customer/profile",
  },

  provider: {
    apply: "/provider/apply",
    dashboard: "/provider/dashboard",
    profile: "/provider/profile",
    services: "/provider/services",
    availability: "/provider/availability",
    bookings: "/provider/bookings",
    booking: (id: string) => `/provider/bookings/${id}`,
    reviews: "/provider/reviews",
    documents: "/provider/documents",
    earnings: "/provider/earnings",
    messages: "/provider/messages",
    notifications: "/provider/notifications",
  },

  admin: {
    dashboard: "/admin/dashboard",
    users: "/admin/users",
    providers: "/admin/providers",
    bookings: "/admin/bookings",
    payments: "/admin/payments",
    categories: "/admin/categories",
    reviews: "/admin/reviews",
    disputes: "/admin/disputes",
    analytics: "/admin/analytics",
    auditLogs: "/admin/audit-logs",
    notifications: "/admin/notifications",
  },
} as const;

/** Landing page for a user right after login, by role. */
export function dashboardForRole(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return ROUTES.admin.dashboard;
    case "PROVIDER":
      return ROUTES.provider.dashboard;
    default:
      return ROUTES.customer.dashboard;
  }
}
