import Link from "next/link";
import { MessageCircle, AtSign, Send, Globe } from "lucide-react";
import { APP_NAME, ROUTES } from "@/constants";
import { SERVICES } from "@/constants/services";

const COMPANY = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Become a provider", href: ROUTES.provider.apply },
  { label: "Sign in", href: ROUTES.login },
  { label: "Create account", href: ROUTES.register },
];

const LEGAL = [
  { label: "Terms of Service", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Trust & Safety", href: "#" },
  { label: "Contact", href: "#" },
];

const SOCIALS = [
  { icon: MessageCircle, href: "#", label: "X" },
  { icon: AtSign, href: "#", label: "Threads" },
  { icon: Send, href: "#", label: "Telegram" },
  { icon: Globe, href: "#", label: "Website" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href={ROUTES.home} className="flex items-center gap-2 text-lg font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
              A
            </span>
            {APP_NAME}
          </Link>
          <p className="mt-3 max-w-xs text-sm text-[var(--muted-foreground)]">
            The trusted marketplace for home services. Verified pros, transparent pricing, real
            reviews.
          </p>
          <div className="mt-4 flex gap-2">
            {SOCIALS.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="grid size-9 place-items-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] transition hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Services</h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted-foreground)]">
            {SERVICES.slice(0, 6).map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="hover:text-[var(--foreground)]">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Company</h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted-foreground)]">
            {COMPANY.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="hover:text-[var(--foreground)]">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Legal</h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted-foreground)]">
            {LEGAL.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="hover:text-[var(--foreground)]">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-sm text-[var(--muted-foreground)]">
          © {APP_NAME}. Built as a demo home-services marketplace. Payments are simulated.
        </div>
      </div>
    </footer>
  );
}
