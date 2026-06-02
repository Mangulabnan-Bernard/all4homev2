import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { searchProviders, getFavoriteProviderIds } from "@/features/providers/queries";
import { listCategories } from "@/features/categories/queries";
import { PageHeader } from "@/components/layout/page-header";
import { ProviderCard } from "@/components/providers/provider-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Find a pro" };
export const dynamic = "force-dynamic";

const SORTS = [
  { value: "rating", label: "Top rated" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

const SELECT_CLASS =
  "h-9 rounded-md border border-[var(--border)] bg-transparent px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

function qs(params: Record<string, string | number | undefined>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : "";
}

export default async function CustomerSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);

  const sort: Sort = SORTS.some((s) => s.value === sp.sort) ? (sp.sort as Sort) : "rating";
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1;

  const [{ items, hasMore }, favIds, categories] = await Promise.all([
    searchProviders({ q: sp.q || undefined, categorySlug: sp.category || undefined, sort, page }),
    getFavoriteProviderIds(userId),
    listCategories(),
  ]);
  const favSet = new Set(favIds);

  const pill = (active: boolean) =>
    cn(
      "rounded-full px-3 py-1 text-sm font-medium transition",
      active
        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
        : "bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
    );

  return (
    <div>
      <PageHeader title="Find a pro" description="Browse verified providers near you." />

      <form className="mb-4 flex flex-wrap items-center gap-2">
        {sp.category && <input type="hidden" name="category" value={sp.category} />}
        <Input name="q" defaultValue={sp.q ?? ""} placeholder="Search providers" className="h-9 w-56" />
        <select name="sort" defaultValue={sort} className={SELECT_CLASS} aria-label="Sort">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm">
          Search
        </Button>
      </form>

      <div className="mb-6 flex flex-wrap gap-1">
        <Link href={`/customer/search${qs({ q: sp.q, sort })}`} className={pill(!sp.category)}>
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/customer/search${qs({ q: sp.q, sort, category: c.slug })}`}
            className={pill(sp.category === c.slug)}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">No providers match your search.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <ProviderCard key={p.id} provider={p} favorited={favSet.has(p.userId)} />
          ))}
        </div>
      )}

      {(page > 1 || hasMore) && (
        <div className="mt-6 flex items-center justify-between">
          {page > 1 ? (
            <Link
              href={`/customer/search${qs({ q: sp.q, category: sp.category, sort, page: page - 1 })}`}
              className="text-sm font-medium text-[var(--primary)] hover:underline"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-[var(--muted-foreground)]">Page {page}</span>
          {hasMore ? (
            <Link
              href={`/customer/search${qs({ q: sp.q, category: sp.category, sort, page: page + 1 })}`}
              className="text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
