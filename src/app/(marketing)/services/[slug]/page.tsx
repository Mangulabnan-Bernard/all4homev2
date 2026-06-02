import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Clock, ShieldCheck, Sparkles } from "lucide-react";

import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { BookingRequestDialog } from "@/components/marketing/booking-request-dialog";
import { getService, SERVICES } from "@/constants/services";
import { ROUTES } from "@/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const INCLUDED = [
  "Background-checked, vetted professionals near you",
  "Upfront, transparent pricing with no hidden fees",
  "Flexible scheduling that works around your day",
  "Secure in-app payments and messaging",
  "Satisfaction backed by ratings and reviews",
];

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const svc = getService(slug);
  return { title: svc ? svc.name : "Service" };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const svc = getService(slug);
  if (!svc) notFound();

  // Booking requires authentication. Read the session from the JWT only (no DB
  // hit) so this public page stays cheap; the real create-booking action is
  // separately guarded by requireCan("booking:create").
  const session = await auth();
  const isAuthed = Boolean(session?.user);

  const Icon = svc.icon;
  const related = SERVICES.filter((s) => s.slug !== svc.slug).slice(0, 3);

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)]">
      {/* Hero */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium",
                  svc.accent,
                )}
              >
                <Icon className="h-4 w-4" />
                {svc.tagline}
              </span>

              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">{svc.name}</h1>

              <p className="mt-4 max-w-prose text-lg text-[var(--muted-foreground)]">
                {svc.description}
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-sm font-medium text-[var(--muted-foreground)]">from</span>
                <span className="text-3xl font-bold tracking-tight">
                  {formatCurrency(svc.startingPrice)}
                </span>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {isAuthed ? (
                  <BookingRequestDialog serviceName={svc.name} startingPrice={svc.startingPrice} />
                ) : (
                  <Link
                    href={`${ROUTES.login}?callbackUrl=${encodeURIComponent(`/services/${svc.slug}`)}`}
                    className={cn(buttonVariants({ size: "lg" }), "group")}
                  >
                    Sign in to book
                    <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )}
                <Link
                  href="/#how-it-works"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                >
                  How it works
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[var(--muted-foreground)]">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Vetted pros
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Same-week availability
                </span>
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Quality guaranteed
                </span>
              </div>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--border)] shadow-sm">
              <Image
                src={svc.image}
                alt={svc.name}
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="border-t border-[var(--border)] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What&apos;s included</h2>
          <p className="mt-3 max-w-prose text-[var(--muted-foreground)]">
            Every {svc.name.toLowerCase()} booking on {`All4Home`} comes with the essentials sorted.
          </p>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-[var(--card-foreground)] shadow-sm"
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    svc.accent,
                  )}
                >
                  <Check className="h-4 w-4" />
                </span>
                <span className="text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Related services */}
      <section className="border-t border-[var(--border)] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Related services</h2>
            <Link
              href="/services"
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Browse all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((s) => {
              const RelatedIcon = s.icon;
              return (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={s.image}
                      alt={s.name}
                      fill
                      sizes="(max-width:768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <span
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-xl",
                        s.accent,
                      )}
                    >
                      <RelatedIcon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold tracking-tight">{s.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                      {s.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        from{" "}
                        <span className="font-semibold text-[var(--foreground)]">
                          {formatCurrency(s.startingPrice)}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
