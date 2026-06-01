'use client';

import Image from "next/image";
import { Star } from "lucide-react";
import { Carousel } from "@/components/ui/carousel";

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  avatarId: number;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Booking a deep clean took two minutes and the team showed up right on time. My place has never looked this good.",
    name: "Mariel Santos",
    role: "Cleaning customer",
    avatarId: 12,
  },
  {
    quote:
      "The plumber diagnosed the leak fast and fixed it the same day. Transparent pricing with no surprises at the end.",
    name: "David Reyes",
    role: "Plumbing customer",
    avatarId: 33,
  },
  {
    quote:
      "I've rebooked the same electrician three times now. Reliable, tidy, and genuinely friendly every single visit.",
    name: "Hannah Lim",
    role: "Electrical customer",
    avatarId: 5,
  },
  {
    quote:
      "Our move-out clean passed the landlord inspection with zero issues. Got the full deposit back thanks to All4Home.",
    name: "Tomas Bautista",
    role: "Move-out cleaning customer",
    avatarId: 47,
  },
  {
    quote:
      "From quote to finished job, everything was handled in the app. The aircon servicing made a huge difference overnight.",
    name: "Priya Nair",
    role: "Aircon servicing customer",
    avatarId: 24,
  },
  {
    quote:
      "Easily the smoothest home repair experience I've had. Clear updates, a fair price, and craftsmanship I trust.",
    name: "Jared Cooke",
    role: "Handyman customer",
    avatarId: 60,
  },
];

export function Testimonials() {
  const slides = TESTIMONIALS.map((t) => (
    <div
      key={t.name}
      className="mx-auto max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-[var(--card-foreground)] shadow-sm"
    >
      <div className="flex items-center justify-center gap-1 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-5 fill-current" />
        ))}
      </div>

      <blockquote className="mt-6 text-lg leading-relaxed text-[var(--card-foreground)]">
        &ldquo;{t.quote}&rdquo;
      </blockquote>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Image
          src={`https://i.pravatar.cc/120?img=${t.avatarId}`}
          alt={t.name}
          width={64}
          height={64}
          className="rounded-full border border-[var(--border)]"
        />
        <div>
          <div className="font-semibold tracking-tight">{t.name}</div>
          <div className="text-sm text-[var(--muted-foreground)]">{t.role}</div>
        </div>
      </div>
    </div>
  ));

  return (
    <section className="bg-[var(--accent)]/40 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by homeowners
          </h2>
          <p className="mt-4 text-[var(--muted-foreground)]">
            Thousands of households trust All4Home for the help that keeps their
            homes running.
          </p>
        </div>

        <div className="mt-12 sm:mt-16">
          <Carousel
            slides={slides}
            perView={1}
            autoPlayMs={6000}
            showArrows
            showDots
            ariaLabel="Customer testimonials"
          />
        </div>
      </div>
    </section>
  );
}
