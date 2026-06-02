import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { auth } from "@/auth";
import { dashboardForRole } from "@/constants";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name ?? null, dashboardHref: dashboardForRole(session.user.role) }
    : null;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader user={user} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
