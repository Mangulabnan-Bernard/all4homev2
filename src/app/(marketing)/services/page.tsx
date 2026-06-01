import type { Metadata } from "next";
import { ServiceExplorer } from "@/components/marketing/service-explorer";
import { CtaBand } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Browse and search trusted home-service professionals — cleaning, repairs, grooming and more.",
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;

  return (
    <>
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--card-foreground)] sm:text-4xl">
            All services
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">
            Browse trusted, vetted professionals for every corner of your home. From quick fixes to
            full makeovers, search and filter to book the help you need in just a few taps.
          </p>
        </div>
      </header>

      {/* key forces a remount when the URL query changes, so filter state always
          mirrors the URL (e.g. category links from the header) — the page is a
          Server Component that re-renders with fresh searchParams on navigation. */}
      <ServiceExplorer
        key={`${q ?? ""}|${category ?? ""}`}
        initialQuery={q}
        initialCategory={category}
      />

      <CtaBand />
    </>
  );
}
