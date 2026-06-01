const STATS: { value: string; label: string }[] = [
  { value: "12,000+", label: "bookings" },
  { value: "2,400+", label: "verified pros" },
  { value: "4.9★", label: "avg rating" },
  { value: "12", label: "cities" },
];

export function Stats() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] p-8 sm:p-12 shadow-sm">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl sm:text-4xl font-bold tracking-tight">
                  {stat.value}
                </div>
                <div className="opacity-80 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
