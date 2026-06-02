import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Check } from "lucide-react";

import { auth } from "@/auth";
import { getMyProviderProfile } from "@/features/providers/queries";
import { listCategories } from "@/features/categories/queries";
import { ApplyProviderForm } from "@/components/providers/apply-form";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES, VERIFICATION_STATUS_META } from "@/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Become a provider" };
export const dynamic = "force-dynamic";

const PERKS = [
  "List your services and set your own rates",
  "Manage availability and accept bookings",
  "Get paid through secure in-app payments",
  "Build your reputation with ratings and reviews",
];

export default async function ProviderApplyPage() {
  const session = await auth();
  const userId = session?.user?.id;

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-3 py-1 text-sm font-medium">
          <BriefcaseBusiness className="size-4" />
          Become a provider
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
          Grow your business with All4Home
        </h1>
        <p className="mx-auto mt-3 max-w-prose text-[var(--muted-foreground)]">
          Apply to offer your services to thousands of local customers.
        </p>
      </div>

      <ul className="mx-auto mt-8 grid max-w-md gap-2">
        {PERKS.map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
            {perk}
          </li>
        ))}
      </ul>

      <div className="mt-10">{await renderAction(userId)}</div>
    </section>
  );
}

async function renderAction(userId: string | undefined) {
  // Not signed in → funnel to login, returning here afterwards.
  if (!userId) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          Sign in to your account to start your provider application.
        </p>
        <Link
          href={`${ROUTES.login}?callbackUrl=${encodeURIComponent(ROUTES.provider.apply)}`}
          className={cn(buttonVariants({ size: "lg" }), "mt-4")}
        >
          Sign in to apply
        </Link>
      </div>
    );
  }

  const [profile, categories] = await Promise.all([
    getMyProviderProfile(userId),
    listCategories(),
  ]);

  // Already applied → show status instead of the form.
  if (profile) {
    const vmeta = VERIFICATION_STATUS_META[profile.verificationStatus];
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
            vmeta.className,
          )}
        >
          {vmeta.label}
        </span>
        <h2 className="mt-4 text-lg font-semibold">You&apos;ve already applied</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--muted-foreground)]">
          {profile.verificationStatus === "APPROVED"
            ? "Your application is approved — your provider tools are unlocked."
            : profile.verificationStatus === "REJECTED"
              ? "Your application wasn't approved. Contact support if you think this is a mistake."
              : "Your application is awaiting admin review. We'll notify you when it's decided."}
        </p>
        {profile.verificationStatus === "APPROVED" && (
          <Link href={ROUTES.provider.dashboard} className={cn(buttonVariants(), "mt-6")}>
            Go to provider dashboard
          </Link>
        )}
      </div>
    );
  }

  return <ApplyProviderForm categories={categories} />;
}
