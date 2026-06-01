import { Search, CalendarCheck, Handshake, Star, type LucideIcon } from "lucide-react";

type Step = {
  num: number;
  title: string;
  text: string;
  icon: LucideIcon;
  accent: string;
};

const STEPS: Step[] = [
  {
    num: 1,
    title: "Search",
    text: "Find the right pro",
    icon: Search,
    accent: "bg-sky-100 text-sky-700",
  },
  {
    num: 2,
    title: "Book",
    text: "Pick a time & confirm",
    icon: CalendarCheck,
    accent: "bg-violet-100 text-violet-700",
  },
  {
    num: 3,
    title: "Relax",
    text: "Your pro arrives & does the job",
    icon: Handshake,
    accent: "bg-emerald-100 text-emerald-700",
  },
  {
    num: 4,
    title: "Review",
    text: "Rate your experience",
    icon: Star,
    accent: "bg-amber-100 text-amber-700",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-[var(--background)]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)]">
            How it works
          </h2>
          <p className="mt-4 text-[var(--muted-foreground)]">
            From search to sparkle in four simple steps.
          </p>
        </div>

        <div className="mt-12 sm:mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ num, title, text, icon: Icon, accent }) => (
            <div
              key={num}
              className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-2 -top-4 select-none text-7xl font-bold leading-none text-[var(--muted-foreground)]/10"
              >
                {num}
              </span>

              <div className="relative flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)]">
                  {num}
                </span>
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent} transition-transform group-hover:scale-110`}
                >
                  <Icon className="h-6 w-6" />
                </span>
              </div>

              <h3 className="relative mt-5 text-lg font-semibold text-[var(--card-foreground)]">
                {title}
              </h3>
              <p className="relative mt-1 text-sm text-[var(--muted-foreground)]">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
