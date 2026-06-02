"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { setAvailabilityAction } from "@/actions/providers/set-availability";
import { Button } from "@/components/ui/button";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const FIELD_CLASS =
  "h-9 rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

type Slot = { dayOfWeek: number; startTime: string; endTime: string };

export function AvailabilityEditor({ initialSlots }: { initialSlots: Slot[] }) {
  const router = useRouter();
  const [slots, setSlots] = React.useState<Slot[]>(initialSlots);
  const [saving, setSaving] = React.useState(false);

  const update = (i: number, patch: Partial<Slot>) =>
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const add = () =>
    setSlots((prev) => [...prev, { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }]);
  const remove = (i: number) => setSlots((prev) => prev.filter((_, idx) => idx !== i));

  async function save() {
    if (slots.some((s) => s.startTime >= s.endTime)) {
      toast.error("Each slot's start time must be before its end time.");
      return;
    }
    setSaving(true);
    const res = await setAvailabilityAction({ slots });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Availability saved.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {slots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            No availability set yet. Add the hours you work each week.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {slots.map((s, i) => (
            <li
              key={i}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3"
            >
              <select
                aria-label="Day"
                className={`${FIELD_CLASS} w-36`}
                value={s.dayOfWeek}
                onChange={(e) => update(i, { dayOfWeek: Number(e.target.value) })}
              >
                {DAYS.map((d, idx) => (
                  <option key={idx} value={idx}>
                    {d}
                  </option>
                ))}
              </select>
              <input
                type="time"
                aria-label="Start time"
                className={FIELD_CLASS}
                value={s.startTime}
                onChange={(e) => update(i, { startTime: e.target.value })}
              />
              <span className="text-sm text-[var(--muted-foreground)]">to</span>
              <input
                type="time"
                aria-label="End time"
                className={FIELD_CLASS}
                value={s.endTime}
                onChange={(e) => update(i, { endTime: e.target.value })}
              />
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                aria-label="Remove slot"
                onClick={() => remove(i)}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={add}>
          <Plus className="size-4" />
          Add slot
        </Button>
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Save availability
        </Button>
      </div>
    </div>
  );
}
