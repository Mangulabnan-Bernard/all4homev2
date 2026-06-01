import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Access denied" };

export default function ForbiddenPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-[var(--destructive)]/10 text-[var(--destructive)]">
        <Lock className="size-7" />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">Access denied</h1>
      <p className="mt-3 text-[var(--muted-foreground)]">
        You don&apos;t have permission to view this page with your current account.
      </p>
      <Link href="/" className={cn(buttonVariants({ size: "lg" }), "mt-8")}>
        Back home
      </Link>
    </section>
  );
}
