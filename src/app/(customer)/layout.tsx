import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions/guard";
import { getUnreadCount } from "@/features/notifications/queries";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ROUTES } from "@/constants";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${ROUTES.customer.dashboard}`);
  if (user.role !== "CUSTOMER") redirect(ROUTES.forbidden);

  const unreadCount = await getUnreadCount(user.id);
  return (
    <DashboardShell
      role="CUSTOMER"
      user={{ name: user.name, email: user.email }}
      unreadCount={unreadCount}
      notificationsHref={ROUTES.customer.notifications}
    >
      {children}
    </DashboardShell>
  );
}
