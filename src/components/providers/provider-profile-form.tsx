"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { providerProfileSchema, type ProviderProfileInput } from "@/lib/validators/providers";
import { updateProfileAction } from "@/actions/providers/update-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

export function ProviderProfileForm({
  categories,
  defaults,
}: {
  categories: { id: string; name: string }[];
  defaults: ProviderProfileInput;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProviderProfileInput>({
    resolver: zodResolver(providerProfileSchema),
    defaultValues: defaults,
  });

  const onSubmit = handleSubmit(async (values) => {
    const res = await updateProfileAction(values);
    if (!res.ok) {
      const fe = res.error.fieldErrors;
      if (fe) {
        for (const [k, m] of Object.entries(fe)) {
          if (m?.[0]) setError(k as keyof ProviderProfileInput, { message: m[0] });
        }
      }
      toast.error(res.error.message);
      return;
    }
    toast.success("Provider profile saved.");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
        <Label htmlFor="bio">Short bio</Label>
        <Textarea id="bio" rows={3} {...register("bio")} />
        {errors.bio && <p className="text-xs text-[var(--destructive)]">{errors.bio.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Full description</Label>
        <Textarea id="description" rows={5} {...register("description")} />
        {errors.description && (
          <p className="text-xs text-[var(--destructive)]">{errors.description.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="hourlyRate">Hourly rate</Label>
          <Input id="hourlyRate" type="number" step="0.01" min={0} {...register("hourlyRate")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="experienceYears">Experience (yrs)</Label>
          <Input id="experienceYears" type="number" min={0} {...register("experienceYears")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="serviceRadiusKm">Radius (km)</Label>
          <Input id="serviceRadiusKm" type="number" min={1} {...register("serviceRadiusKm")} />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Save profile
      </Button>
    </form>
  );
}
