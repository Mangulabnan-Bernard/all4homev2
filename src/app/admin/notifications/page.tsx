import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getNotifications } from "@/features/notifications/queries";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { ROUTES } from "@/constants";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);

  const items = await getNotifications(userId);

  return (
    <div>
      <PageHeader title="Notifications" description="System and account updates." />
      <NotificationsList items={items} />
    </div>
  );
}
