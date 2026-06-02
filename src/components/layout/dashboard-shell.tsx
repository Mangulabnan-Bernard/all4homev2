"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarCheck,
  CalendarClock,
  Clock,
  CreditCard,
  FileText,
  Gavel,
  Heart,
  LayoutDashboard,
  Menu,
  MessageSquare,
  ScrollText,
  Search,
  ShieldCheck,
  Star,
  Tags,
  User,
  Users,
  Wallet,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@prisma/client";

import { APP_NAME, ROUTES } from "@/constants";
import { cn } from "@/lib/utils";
import { SignOutButton } from "./sign-out-button";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV: Record<UserRole, NavItem[]> = {
  CUSTOMER: [
    { label: "Dashboard", href: ROUTES.customer.dashboard, icon: LayoutDashboard },
    { label: "Find a pro", href: ROUTES.customer.search, icon: Search },
    { label: "My bookings", href: ROUTES.customer.bookings, icon: CalendarClock },
    { label: "Favorites", href: ROUTES.customer.favorites, icon: Heart },
    { label: "Messages", href: ROUTES.customer.messages, icon: MessageSquare },
    { label: "Notifications", href: ROUTES.customer.notifications, icon: Bell },
    { label: "Profile", href: ROUTES.customer.profile, icon: User },
  ],
  PROVIDER: [
    { label: "Dashboard", href: ROUTES.provider.dashboard, icon: LayoutDashboard },
    { label: "Bookings", href: ROUTES.provider.bookings, icon: CalendarCheck },
    { label: "Services", href: ROUTES.provider.services, icon: Wrench },
    { label: "Availability", href: ROUTES.provider.availability, icon: Clock },
    { label: "Documents", href: ROUTES.provider.documents, icon: FileText },
    { label: "Earnings", href: ROUTES.provider.earnings, icon: Wallet },
    { label: "Reviews", href: ROUTES.provider.reviews, icon: Star },
    { label: "Messages", href: ROUTES.provider.messages, icon: MessageSquare },
    { label: "Notifications", href: ROUTES.provider.notifications, icon: Bell },
    { label: "Profile", href: ROUTES.provider.profile, icon: User },
  ],
  ADMIN: [
    { label: "Dashboard", href: ROUTES.admin.dashboard, icon: LayoutDashboard },
    { label: "Users", href: ROUTES.admin.users, icon: Users },
    { label: "Providers", href: ROUTES.admin.providers, icon: ShieldCheck },
    { label: "Bookings", href: ROUTES.admin.bookings, icon: CalendarClock },
    { label: "Payments", href: ROUTES.admin.payments, icon: CreditCard },
    { label: "Categories", href: ROUTES.admin.categories, icon: Tags },
    { label: "Disputes", href: ROUTES.admin.disputes, icon: Gavel },
    { label: "Reviews", href: ROUTES.admin.reviews, icon: Star },
    { label: "Analytics", href: ROUTES.admin.analytics, icon: BarChart3 },
    { label: "Audit logs", href: ROUTES.admin.auditLogs, icon: ScrollText },
    { label: "Notifications", href: ROUTES.admin.notifications, icon: Bell },
  ],
};

const ROLE_LABEL: Record<UserRole, string> = {
  CUSTOMER: "Customer",
  PROVIDER: "Provider",
  ADMIN: "Admin",
};

export function DashboardShell({
  role,
  user,
  unreadCount,
  notificationsHref,
  children,
}: {
  role: UserRole;
  user: { name: string | null; email: string };
  unreadCount: number;
  notificationsHref: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const items = NAV[role];

  const nav = (onNavigate?: () => void) => (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {items.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/" className="flex items-center gap-2 px-5 py-4 text-lg font-bold">
      <span className="grid size-8 place-items-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
        A
      </span>
      {APP_NAME}
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)] md:flex">
        {brand}
        {nav()}
        <div className="border-t border-[var(--border)] p-3">
          <SignOutButton className="w-full justify-start" />
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-[var(--card)] shadow-xl">
            <div className="flex items-center justify-between">
              {brand}
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="mr-3 grid size-9 place-items-center rounded-md hover:bg-[var(--accent)]"
              >
                <X className="size-5" />
              </button>
            </div>
            {nav(() => setOpen(false))}
            <div className="border-t border-[var(--border)] p-3">
              <SignOutButton className="w-full justify-start" />
            </div>
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-[var(--background)]/85 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="grid size-10 place-items-center rounded-md hover:bg-[var(--accent)] md:hidden"
          >
            <Menu className="size-5" />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href={notificationsHref}
              aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
              className="relative grid size-10 place-items-center rounded-full hover:bg-[var(--accent)]"
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-[var(--destructive)] px-1 text-[0.625rem] font-semibold text-[var(--destructive-foreground)]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium leading-tight">{user.name ?? user.email}</div>
              <div className="text-xs text-[var(--muted-foreground)]">{ROLE_LABEL[role]}</div>
            </div>
            <span className="grid size-9 place-items-center rounded-full bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)]">
              {(user.name ?? user.email).charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
