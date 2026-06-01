"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search, SlidersHorizontal, X } from "lucide-react";

import {
  SERVICES,
  SERVICE_CATEGORIES,
  type ServiceCategorySlug,
} from "@/constants/services";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type CategoryFilter = ServiceCategorySlug | "all";
type SortKey = "popular" | "price-asc" | "price-desc" | "name";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A–Z" },
];

function isCategory(value: string | undefined): value is ServiceCategorySlug {
  return SERVICE_CATEGORIES.some((c) => c.slug === value);
}

export function ServiceExplorer({
  initialQuery = "",
  initialCategory,
}: {
  initialQuery?: string;
  initialCategory?: string;
}) {
  const [query, setQuery] = React.useState(initialQuery);
  const [category, setCategory] = React.useState<CategoryFilter>(
    isCategory(initialCategory) ? initialCategory : "all",
  );
  const [sort, setSort] = React.useState<SortKey>("popular");

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = SERVICES.filter((s) => {
      if (category !== "all" && s.category !== category) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.startingPrice - b.startingPrice);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.startingPrice - a.startingPrice);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        sorted.sort((a, b) => Number(Boolean(b.popular)) - Number(Boolean(a.popular)));
    }
    return sorted;
  }, [query, category, sort]);

  const hasFilters = query.trim() !== "" || category !== "all";
  const clearFilters = () => {
    setQuery("");
    setCategory("all");
  };

  return (
    <section className="bg-[var(--background)] py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-6">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] p-2 pl-5 shadow-sm focus-within:ring-2 focus-within:ring-[var(--ring)]">
          <Search className="size-5 shrink-0 text-[var(--muted-foreground)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services — try “cleaning”, “aircon”, “barber”…"
            aria-label="Search services"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)] sm:text-base"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="grid size-7 place-items-center rounded-full text-[var(--muted-foreground)] transition hover:bg-[var(--accent)]"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Filters + sort */}
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
              All services
            </FilterChip>
            {SERVICE_CATEGORIES.map((c) => (
              <FilterChip
                key={c.slug}
                active={category === c.slug}
                onClick={() => setCategory(c.slug)}
              >
                {c.label}
              </FilterChip>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <SlidersHorizontal className="size-4" />
            <span className="sr-only sm:not-sr-only">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 rounded-md border border-[var(--input)] bg-[var(--background)] px-2 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Result count */}
        <p className="mt-5 text-sm text-[var(--muted-foreground)]" aria-live="polite">
          Showing <span className="font-semibold text-[var(--foreground)]">{results.length}</span>{" "}
          {results.length === 1 ? "service" : "services"}
          {hasFilters && (
            <>
              {" "}
              <button
                type="button"
                onClick={clearFilters}
                className="font-medium text-[var(--primary)] hover:underline"
              >
                Clear filters
              </button>
            </>
          )}
        </p>

        {/* Grid / empty state */}
        {results.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--accent)]">
              <Search className="size-6 text-[var(--muted-foreground)]" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No services match “{query}”</h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Try a different search or browse another category.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className={cn(buttonVariants({ variant: "outline" }), "mt-6")}
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((service) => {
              const Icon = service.icon;
              return (
                <Link
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition hover:shadow-lg"
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
                      className={cn(
                        "absolute left-3 top-3 inline-flex size-10 items-center justify-center rounded-xl shadow-sm",
                        service.accent,
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    {service.popular && (
                      <span className="absolute right-3 top-3 rounded-full bg-[var(--primary)] px-2.5 py-1 text-xs font-medium text-[var(--primary-foreground)] shadow-sm">
                        Popular
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-semibold text-[var(--card-foreground)]">{service.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{service.tagline}</p>

                    <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        from{" "}
                        <span className="font-semibold text-[var(--card-foreground)]">
                          {formatCurrency(service.startingPrice)}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] transition group-hover:gap-2">
                        View
                        <ArrowRight className="size-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium transition",
        active
          ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)]",
      )}
    >
      {children}
    </button>
  );
}
