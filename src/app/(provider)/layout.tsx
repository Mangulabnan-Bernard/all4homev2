import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions/guard";
import { getUnreadCount } from "@/features/notifications/queries";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ROUTES } from "@/constants";

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${ROUTES.provider.dashboard}`);
  if (user.role !== "PROVIDER") redirect(ROUTES.forbidden);

  const unreadCount = await getUnreadCount(user.id);
  return (
    <DashboardShell
      role="PROVIDER"
      user={{ name: user.name, email: user.email }}
      unreadCount={unreadCount}
      notificationsHref={ROUTES.provider.notifications}
    >
      {children}
    </DashboardShell>
  );
}
