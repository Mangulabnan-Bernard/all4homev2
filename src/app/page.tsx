import Link from "next/link";
import { Search, ShieldCheck, CalendarCheck, Star } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { APP_NAME, ROUTES } from "@/constants";

const FEATURES = [
  { icon: Search, title: "Find trusted pros", body: "Search verified providers by category, price, and rating." },
  { icon: CalendarCheck, title: "Book in minutes", body: "Pick a service, choose a slot, and confirm — all in one flow." },
  { icon: ShieldCheck, title: "Verified & secure", body: "Every provider is reviewed and approved before they can take jobs." },
  { icon: Star, title: "Real reviews", body: "Ratings come only from confirmed, completed bookings." },
];

export default function HomePage() {
  return (
    <main className="flex-1">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold">{APP_NAME}</span>
          <nav className="flex items-center gap-2">
            <Link href={ROUTES.login} className={cn(buttonVariants({ variant: "ghost" }))}>
              Sign in
            </Link>
            <Link href={ROUTES.register} className={cn(buttonVariants())}>
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Home services, handled.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--muted-foreground)]">
          Book trusted local professionals for cleaning, plumbing, electrical, gardening and more —
          with transparent pricing and verified reviews.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href={ROUTES.register} className={cn(buttonVariants({ size: "lg" }))}>
            Find a pro
          </Link>
          <Link
            href={ROUTES.provider.apply}
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            Become a provider
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardContent className="pt-6">
              <Icon className="mb-3 size-6 text-[var(--primary)]" />
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{body}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
