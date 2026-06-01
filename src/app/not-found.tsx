import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-7xl font-bold tracking-tight text-[var(--primary)]">404</p>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={cn(buttonVariants())}>
          Back home
        </Link>
        <Link href="/services" className={cn(buttonVariants({ variant: "outline" }))}>
          Browse services
        </Link>
      </div>
    </div>
  );
}
