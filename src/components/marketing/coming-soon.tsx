import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Placeholder page for routes whose real flows (auth, provider onboarding) land
 * in a later phase. Keeps every header/footer/CTA link resolvable instead of 404ing.
 */
export function ComingSoon({
  icon: Icon,
  badge,
  title,
  description,
  primary,
}: {
  icon: LucideIcon;
  badge: string;
  title: string;
  description: string;
  primary?: { href: string; label: string };
}) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-[var(--accent)] text-[var(--primary)]">
        <Icon className="size-7" />
      </span>
      <span className="mt-6 inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
        {badge}
      </span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 text-[var(--muted-foreground)]">{description}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {primary && (
          <Link href={primary.href} className={cn(buttonVariants({ size: "lg" }))}>
            {primary.label}
          </Link>
        )}
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
          <ArrowLeft />
          Back home
        </Link>
      </div>
    </section>
  );
}
