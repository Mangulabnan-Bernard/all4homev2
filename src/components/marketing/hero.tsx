"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Star, Sparkles } from "lucide-react";
import { Carousel } from "@/components/ui/carousel";
import { buttonVariants } from "@/components/ui/button";
import { POPULAR_SERVICES } from "@/constants/services";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Hero() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/services?q=${encodeURIComponent(q)}` : "/services");
  };

  const slides = POPULAR_SERVICES.map((service) => (
    <div
      key={service.slug}
      className="relative overflow-hidden rounded-2xl border border-[var(--border)] shadow-sm"
    >
      <div className="relative aspect-[4/3]">
        <Image
          src={service.image}
          alt={service.name}
          fill
          sizes="(max-width:768px) 100vw, 50vw"
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6">
          <div className="flex items-end justify-between gap-4">
            <h3 className="text-lg font-semibold text-white">{service.name}</h3>
            <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white backdrop-blur">
              from {formatCurrency(service.startingPrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  ));

  return (
    <section className="bg-gradient-to-b from-[var(--accent)] to-[var(--background)]">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* LEFT */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-sm font-medium text-[var(--card-foreground)] shadow-sm">
              <Sparkles className="size-4 text-[var(--primary)]" />
              Trusted home services
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
              Home services, <span className="text-[var(--primary)]">handled.</span>
            </h1>

            <p className="mt-5 max-w-md text-lg text-[var(--muted-foreground)]">
              Book vetted, local professionals for cleaning, repairs, grooming and more — in just
              a few taps. Upfront pricing, no surprises.
            </p>

            {/* Search */}
            <form
              onSubmit={onSearch}
              className="mt-8 flex max-w-md items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] p-2 pl-5 shadow-sm focus-within:ring-2 focus-within:ring-[var(--ring)]"
            >
              <Search className="size-5 shrink-0 text-[var(--muted-foreground)]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you need done?"
                aria-label="Search for a service"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)] sm:text-base"
              />
              <button
                type="submit"
                className={cn(buttonVariants({ variant: "default", size: "default" }), "rounded-full")}
              >
                Find a pro
              </button>
            </form>

            {/* Trust line */}
            <div className="mt-6 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span>
                <span className="font-semibold text-[var(--foreground)]">4.9</span> average from
                12,000+ bookings
              </span>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:pl-4">
            <Carousel
              slides={slides}
              perView={1}
              autoPlayMs={5000}
              showArrows
              showDots
              ariaLabel="Popular services"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
