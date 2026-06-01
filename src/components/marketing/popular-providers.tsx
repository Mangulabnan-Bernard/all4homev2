import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Provider {
  name: string;
  service: string;
  city: string;
  rating: number;
  jobs: number;
  priceFrom: number;
  avatarId: number;
}

const PROVIDERS: Provider[] = [
  { name: "Maria Santos", service: "Home Cleaning", city: "Makati", rating: 4.9, jobs: 312, priceFrom: 35, avatarId: 5 },
  { name: "James Reyes", service: "Plumbing", city: "Quezon City", rating: 4.8, jobs: 198, priceFrom: 45, avatarId: 12 },
  { name: "Elena Cruz", service: "Electrical", city: "Pasig", rating: 5.0, jobs: 87, priceFrom: 50, avatarId: 25 },
  { name: "Marco dela Peña", service: "Barber & Grooming", city: "Taguig", rating: 4.7, jobs: 421, priceFrom: 20, avatarId: 33 },
  { name: "Sofia Lim", service: "Gardening & Lawn", city: "Mandaluyong", rating: 4.9, jobs: 156, priceFrom: 30, avatarId: 47 },
  { name: "David Aquino", service: "Moving & Delivery", city: "Parañaque", rating: 4.8, jobs: 264, priceFrom: 60, avatarId: 51 },
  { name: "Carla Mendoza", service: "Painting", city: "San Juan", rating: 4.9, jobs: 143, priceFrom: 40, avatarId: 16 },
  { name: "Noel Bautista", service: "Handyman", city: "Las Piñas", rating: 4.7, jobs: 389, priceFrom: 25, avatarId: 60 },
];

export function PopularProviders() {
  return (
    <section id="providers" className="bg-[var(--background)] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Top-rated providers near you
          </h2>
          <p className="mt-4 text-[var(--muted-foreground)]">
            Hand-picked, background-checked pros with a track record of happy customers.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROVIDERS.map((p) => (
            <div
              key={p.name}
              className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-[var(--card-foreground)] shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <Image
                  src={`https://i.pravatar.cc/120?img=${p.avatarId}`}
                  alt={p.name}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <h3 className="truncate font-semibold tracking-tight">{p.name}</h3>
                  <p className="truncate text-sm text-[var(--muted-foreground)]">{p.service}</p>
                  <p className="truncate text-sm text-[var(--muted-foreground)]">{p.city}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium">{p.rating.toFixed(1)}</span>
                <span className="text-[var(--muted-foreground)]">({p.jobs})</span>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4">
                <span className="text-sm text-[var(--muted-foreground)]">
                  from{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    {formatCurrency(p.priceFrom)}
                  </span>
                </span>
                <Link
                  href={ROUTES.register}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  View profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
