import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SERVICES } from "@/constants/services";
import { formatCurrency } from "@/lib/format";

export function ServicesSection() {
  return (
    <section className="bg-[var(--background)] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Browse by service
          </h2>
          <p className="mt-4 text-base text-[var(--muted-foreground)]">
            From a quick tidy-up to a full home overhaul, find a trusted pro for
            every job around the house.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition hover:shadow-lg"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    sizes="(max-width:768px) 100vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span
                    className={`absolute left-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${service.accent}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-[var(--card-foreground)]">
                    {service.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {service.tagline}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
                    <span className="text-sm text-[var(--muted-foreground)]">
                      from{" "}
                      <span className="font-semibold text-[var(--card-foreground)]">
                        {formatCurrency(service.startingPrice)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] transition group-hover:gap-2">
                      Book
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
