"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { categorySchema, type CategoryInput } from "@/lib/validators/categories";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  isActive: boolean;
  serviceCount: number;
};

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<Category | "new" | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const editingId = editing && editing !== "new" ? editing.id : null;

  async function onDelete(id: string) {
    if (!window.confirm("Delete this category?")) return;
    setDeletingId(id);
    const res = await deleteCategoryAction({ id });
    setDeletingId(null);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Category deleted.");
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
          Add category
        </Button>
      </div>

      {editing === "new" && (
        <CategoryForm onClose={() => setEditing(null)} onSaved={closeAndRefresh} />
      )}

      <ul className="space-y-2">
        {categories.map((c) =>
          editingId === c.id ? (
            <li key={c.id}>
              <CategoryForm
                category={c}
                onClose={() => setEditing(null)}
                onSaved={closeAndRefresh}
              />
            </li>
          ) : (
            <li
              key={c.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{c.name}</p>
                  {!c.isActive && (
                    <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  /{c.slug} · {c.serviceCount} service{c.serviceCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="outline" size="sm" aria-label="Edit" onClick={() => setEditing(c)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Delete"
                  disabled={deletingId === c.id}
                  onClick={() => onDelete(c.id)}
                >
                  {deletingId === c.id ? (
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
    </div>
  );
}

function CategoryForm({
  category,
  onClose,
  onSaved,
}: {
  category?: Category;
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? { name: category.name, slug: category.slug, icon: category.icon ?? "", isActive: category.isActive }
      : { name: "", slug: "", icon: "", isActive: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    const res = category
      ? await updateCategoryAction({ id: category.id, ...values })
      : await createCategoryAction(values);
    if (!res.ok) {
      const fe = res.error.fieldErrors;
      if (fe) {
        for (const [k, m] of Object.entries(fe)) {
          if (m?.[0]) setError(k as keyof CategoryInput, { message: m[0] });
        }
      }
      toast.error(res.error.message);
      return;
    }
    toast.success(category ? "Category updated." : "Category created.");
    onSaved();
  });

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--card)] p-4"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cat-name">Name</Label>
          <Input id="cat-name" {...register("name")} />
          {errors.name && <p className="text-xs text-[var(--destructive)]">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-slug">Slug</Label>
          <Input id="cat-slug" placeholder="home-cleaning" {...register("slug")} />
          {errors.slug && <p className="text-xs text-[var(--destructive)]">{errors.slug.message}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cat-icon">Icon (optional)</Label>
        <Input id="cat-icon" placeholder="lucide icon name" {...register("icon")} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 rounded border-[var(--border)]" {...register("isActive")} />
        Active
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
