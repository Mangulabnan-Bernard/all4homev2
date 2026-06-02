"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

import {
  providerApplicationSchema,
  type ProviderApplicationInput,
} from "@/lib/validators/providers";
import { applyProviderAction } from "@/actions/providers/apply-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

export function ApplyProviderForm({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [submitted, setSubmitted] = React.useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProviderApplicationInput>({
    resolver: zodResolver(providerApplicationSchema),
    defaultValues: {
      categoryId: categories[0]?.id ?? "",
      bio: "",
      hourlyRate: 0,
      experienceYears: 0,
      serviceRadiusKm: 10,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const res = await applyProviderAction(values);
    if (!res.ok) {
      const fe = res.error.fieldErrors;
      if (fe) {
        for (const [k, m] of Object.entries(fe)) {
          if (m?.[0]) setError(k as keyof ProviderApplicationInput, { message: m[0] });
        }
      }
      toast.error(res.error.message);
      return;
    }
    setSubmitted(true);
    toast.success("Application submitted!");
    router.refresh();
  });

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-green-100 text-green-700">
          <CheckCircle2 className="size-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Application submitted</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--muted-foreground)]">
          An admin will review your application. You&apos;ll be notified once it&apos;s approved, and
          your provider dashboard will unlock.
        </p>
        <Link href={ROUTES.customer.dashboard} className={cn(buttonVariants(), "mt-6")}>
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
      noValidate
    >
      <div className="space-y-1.5">
        <Label htmlFor="categoryId">Primary category</Label>
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
        <Label htmlFor="bio">About you</Label>
        <Textarea
          id="bio"
          rows={4}
          placeholder="Tell customers about your experience and what you offer (20+ characters)…"
          {...register("bio")}
        />
        {errors.bio && <p className="text-xs text-[var(--destructive)]">{errors.bio.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="hourlyRate">Hourly rate</Label>
          <Input id="hourlyRate" type="number" step="0.01" min={0} {...register("hourlyRate")} />
          {errors.hourlyRate && (
            <p className="text-xs text-[var(--destructive)]">{errors.hourlyRate.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="experienceYears">Experience (yrs)</Label>
          <Input id="experienceYears" type="number" min={0} {...register("experienceYears")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="serviceRadiusKm">Service radius (km)</Label>
          <Input id="serviceRadiusKm" type="number" min={1} {...register("serviceRadiusKm")} />
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Submit application
      </Button>
    </form>
  );
}
