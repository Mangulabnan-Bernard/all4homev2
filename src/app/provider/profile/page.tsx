import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getMyAccount } from "@/features/user/queries";
import { getMyProviderProfile } from "@/features/providers/queries";
import { listCategories } from "@/features/categories/queries";
import { PageHeader } from "@/components/layout/page-header";
import { AccountForm } from "@/components/account/account-form";
import { DarkModeToggle } from "@/components/account/dark-mode-toggle";
import { ProviderProfileForm } from "@/components/providers/provider-profile-form";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES, VERIFICATION_STATUS_META } from "@/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProviderProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);

  const [account, profile, categories] = await Promise.all([
    getMyAccount(userId),
    getMyProviderProfile(userId),
    listCategories(),
  ]);
  if (!account) redirect(ROUTES.login);

  const vmeta = profile ? VERIFICATION_STATUS_META[profile.verificationStatus] : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title="Profile" description="Manage your account and provider profile." />

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
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Provider profile</h2>
          {vmeta && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
                vmeta.className,
              )}
            >
              {vmeta.label}
            </span>
          )}
        </div>

        {profile ? (
          <div className="mt-4">
            <ProviderProfileForm
              categories={categories}
              defaults={{
                categoryId: categories.find((c) => c.slug === profile.categorySlug)?.id ?? "",
                bio: profile.bio ?? "",
                description: profile.description ?? "",
                hourlyRate: profile.hourlyRate,
                experienceYears: profile.experienceYears,
                serviceRadiusKm: profile.serviceRadiusKm,
              }}
            />
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              You don&apos;t have a provider profile yet.
            </p>
            <Link
              href={ROUTES.provider.apply}
              className={cn(buttonVariants({ size: "sm" }), "mt-4")}
            >
              Start your application
            </Link>
          </div>
        )}
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
