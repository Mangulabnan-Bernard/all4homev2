"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_NAME, ROUTES } from "@/constants";
import { groupedServices } from "@/constants/services";

const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Providers", href: "/#providers" },
  { label: "Become a provider", href: ROUTES.provider.apply },
];

const SERVICE_GROUPS = groupedServices();

const MOBILE_DRAWER_ID = "mobile-nav-drawer";

export function SiteHeader() {
  const [servicesOpen, setServicesOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const panelId = React.useId();

  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setServicesOpen(true);
  };
  const closeMenu = () => {
    closeTimer.current = setTimeout(() => setServicesOpen(false), 120);
  };

  // Close the services menu on Escape and return focus to its trigger.
  React.useEffect(() => {
    if (!servicesOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setServicesOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [servicesOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/70">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link href={ROUTES.home} className="flex items-center gap-2 text-xl font-bold">
          <span className="grid size-8 place-items-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
            A
          </span>
          {APP_NAME}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <div
            onMouseEnter={openMenu}
            onMouseLeave={closeMenu}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                if (closeTimer.current) clearTimeout(closeTimer.current);
                setServicesOpen(false);
              }
            }}
          >
            <button
              ref={triggerRef}
              type="button"
              className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium hover:bg-[var(--accent)]"
              aria-haspopup="true"
              aria-expanded={servicesOpen}
              aria-controls={panelId}
              onClick={() => setServicesOpen((v) => !v)}
            >
              Services
              <ChevronDown
                className={cn("size-4 transition-transform", servicesOpen && "rotate-180")}
              />
            </button>

            {servicesOpen && (
              <div
                id={panelId}
                className="absolute left-1/2 top-full w-[min(96vw,52rem)] -translate-x-1/2 pt-2"
              >
                <div className="rounded-xl border border-[var(--border)] bg-[var(--popover)] p-4 shadow-xl">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                    {SERVICE_GROUPS.map(({ category, services }) => (
                      <div key={category.slug} className="min-w-0">
                        <Link
                          href={`/services?category=${category.slug}`}
                          onClick={() => setServicesOpen(false)}
                          className="block px-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
                        >
                          {category.label}
                        </Link>
                        <ul className="mt-2 space-y-0.5">
                          {services.map(({ slug, name, icon: Icon, accent }) => (
                            <li key={slug}>
                              <Link
                                href={`/services/${slug}`}
                                onClick={() => setServicesOpen(false)}
                                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-[var(--accent)]"
                              >
                                <span
                                  className={cn(
                                    "grid size-7 shrink-0 place-items-center rounded-md",
                                    accent,
                                  )}
                                >
                                  <Icon className="size-4" />
                                </span>
                                <span className="truncate">{name}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/services"
                    className="mt-3 block rounded-lg bg-[var(--accent)] p-3 text-center text-sm font-medium hover:opacity-90"
                    onClick={() => setServicesOpen(false)}
                  >
                    Browse all services →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-[var(--accent)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href={ROUTES.login} className={cn(buttonVariants({ variant: "ghost" }))}>
            Sign in
          </Link>
          <Link href={ROUTES.register} className={cn(buttonVariants())}>
            Get started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="grid size-10 place-items-center rounded-md hover:bg-[var(--accent)] md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls={MOBILE_DRAWER_ID}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          id={MOBILE_DRAWER_ID}
          className="border-t border-[var(--border)] bg-[var(--background)] md:hidden"
        >
          <div className="mx-auto max-w-6xl space-y-1 px-6 py-4">
            <div className="flex items-center justify-between px-1 pb-1">
              <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">
                Services
              </p>
              <Link
                href="/services"
                className="text-xs font-medium text-[var(--primary)]"
                onClick={() => setMobileOpen(false)}
              >
                Browse all →
              </Link>
            </div>
            {SERVICE_GROUPS.map(({ category, services }) => (
              <div key={category.slug} className="pb-2">
                <p className="px-1 pt-2 text-[0.7rem] font-medium uppercase tracking-wide text-[var(--muted-foreground)]/80">
                  {category.label}
                </p>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  {services.map(({ slug, name, icon: Icon, accent }) => (
                    <Link
                      key={slug}
                      href={`/services/${slug}`}
                      className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-[var(--accent)]"
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className={cn("grid size-7 shrink-0 place-items-center rounded-md", accent)}>
                        <Icon className="size-4" />
                      </span>
                      <span className="truncate">{name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="pt-2">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block rounded-md px-1 py-2 text-sm font-medium hover:bg-[var(--accent)]"
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Link
                href={ROUTES.login}
                className={cn(buttonVariants({ variant: "outline" }), "flex-1")}
              >
                Sign in
              </Link>
              <Link href={ROUTES.register} className={cn(buttonVariants(), "flex-1")}>
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
