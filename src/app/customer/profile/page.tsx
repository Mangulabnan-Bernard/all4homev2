import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getMyAccount } from "@/features/user/queries";
import { PageHeader } from "@/components/layout/page-header";
import { AccountForm } from "@/components/account/account-form";
import { DarkModeToggle } from "@/components/account/dark-mode-toggle";
import { ROUTES } from "@/constants";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function CustomerProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);

  const account = await getMyAccount(userId);
  if (!account) redirect(ROUTES.login);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title="Profile" description="Manage your account details." />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">{account.email}</p>
        <AccountForm
          defaults={{
            name: account.name ?? "",
            phone: account.phone ?? "",
            address: account.address ?? "",
            image: account.image ?? "",
          }}
        />
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Dark mode</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Switch between light and dark themes.
            </p>
          </div>
          <DarkModeToggle initial={account.darkMode} />
        </div>
      </section>
    </div>
  );
}
