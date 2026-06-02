import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Dashboard metric tile. Server-rendered; the icon is passed by the page. */
export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "bg-[var(--accent)] text-[var(--foreground)]",
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-[var(--card-foreground)] shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
        <span className={cn("grid size-9 place-items-center rounded-xl", accent)}>
          <Icon className="size-5" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-[var(--muted-foreground)]">{hint}</div>}
    </div>
  );
}
