import Link from "next/link";

import { ROUTES } from "@/constants";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaBand() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="rounded-3xl bg-gradient-to-r from-[var(--primary)] to-indigo-600 p-10 text-center text-[var(--primary-foreground)] shadow-lg sm:p-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base/relaxed text-[var(--primary-foreground)]/90 sm:text-lg">
            Book trusted home pros in minutes, or grow your business by joining
            our network of providers. It only takes a moment to begin.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={ROUTES.register}
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "bg-white text-[var(--primary)] shadow-sm transition-colors hover:bg-white/90",
              )}
            >
              Find a pro
            </Link>
            <Link
              href={ROUTES.provider.apply}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-white/70 bg-transparent text-[var(--primary-foreground)] transition-colors hover:bg-white/10 hover:text-[var(--primary-foreground)]",
              )}
            >
              Become a provider
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
