"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { ServiceDTO } from "@/types/dto";

import { serviceSchema, type ServiceInput } from "@/lib/validators/providers";
import { upsertServiceAction } from "@/actions/providers/upsert-service";
import { deleteServiceAction } from "@/actions/providers/delete-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

type Category = { id: string; name: string };

export function ServicesManager({
  services,
  categories,
}: {
  services: ServiceDTO[];
  categories: Category[];
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<ServiceDTO | "new" | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const editingId = editing && editing !== "new" ? editing.id : null;

  async function onDelete(id: string) {
    if (!window.confirm("Delete this service? This can't be undone.")) return;
    setDeletingId(id);
    const res = await deleteServiceAction({ id });
    setDeletingId(null);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Service deleted.");
    router.refresh();
  }

  function closeAndRefresh() {
    setEditing(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")} disabled={editing === "new"}>
          <Plus className="size-4" />
          Add service
        </Button>
      </div>

      {editing === "new" && (
        <ServiceForm
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={closeAndRefresh}
        />
      )}

      {services.length === 0 && editing !== "new" ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            No services yet. Add your first one so customers can book you.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {services.map((s) =>
            editingId === s.id ? (
              <li key={s.id}>
                <ServiceForm
                  service={s}
                  categories={categories}
                  onClose={() => setEditing(null)}
                  onSaved={closeAndRefresh}
                />
              </li>
            ) : (
              <li
                key={s.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{s.title}</p>
                    {!s.isActive && (
                      <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {formatCurrency(s.price)} · {s.durationMin} min
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Edit service"
                    onClick={() => setEditing(s)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Delete service"
                    disabled={deletingId === s.id}
                    onClick={() => onDelete(s.id)}
                  >
                    {deletingId === s.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function ServiceForm({
  service,
  categories,
  onClose,
  onSaved,
}: {
  service?: ServiceDTO;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service
      ? {
          id: service.id,
          categoryId: service.categoryId,
          title: service.title,
          description: service.description ?? "",
          price: service.price,
          durationMin: service.durationMin,
          isActive: service.isActive,
        }
      : {
          categoryId: categories[0]?.id ?? "",
          title: "",
          description: "",
          price: 0,
          durationMin: 60,
          isActive: true,
        },
  });

  const onSubmit = handleSubmit(async (values) => {
    const res = await upsertServiceAction(values);
    if (!res.ok) {
      const fe = res.error.fieldErrors;
      if (fe) {
        for (const [k, m] of Object.entries(fe)) {
          if (m?.[0]) setError(k as keyof ServiceInput, { message: m[0] });
        }
      }
      toast.error(res.error.message);
      return;
    }
    toast.success(service ? "Service updated." : "Service added.");
    onSaved();
  });

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--card)] p-4"
      noValidate
    >
      {service && <input type="hidden" {...register("id")} />}

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register("title")} />
        {errors.title && <p className="text-xs text-[var(--destructive)]">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="categoryId">Category</Label>
        <select id="categoryId" className={SELECT_CLASS} {...register("categoryId")}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p className="text-xs text-[var(--destructive)]">{errors.categoryId.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={3} {...register("description")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="price">Price</Label>
          <Input id="price" type="number" step="0.01" min={0} {...register("price")} />
          {errors.price && (
            <p className="text-xs text-[var(--destructive)]">{errors.price.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="durationMin">Duration (min)</Label>
          <Input id="durationMin" type="number" min={15} step={5} {...register("durationMin")} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 rounded border-[var(--border)]" {...register("isActive")} />
        Visible to customers
      </label>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Save
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
