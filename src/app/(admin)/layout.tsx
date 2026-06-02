import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions/guard";
import { getUnreadCount } from "@/features/notifications/queries";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ROUTES } from "@/constants";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${ROUTES.admin.dashboard}`);
  if (user.role !== "ADMIN") redirect(ROUTES.forbidden);

  const unreadCount = await getUnreadCount(user.id);
  return (
    <DashboardShell
      role="ADMIN"
      user={{ name: user.name, email: user.email }}
      unreadCount={unreadCount}
      notificationsHref={ROUTES.admin.notifications}
    >
      {children}
    </DashboardShell>
  );
}
