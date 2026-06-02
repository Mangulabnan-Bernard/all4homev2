"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import type { UpdateProfileInput } from "@/lib/validators/user";
import { updateUserProfileAction } from "@/actions/user/update-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Form-level schema: plain strings (empty = "untouched"); the server re-validates
// the image URL and any blanks are dropped before the action runs.
const accountFormSchema = z.object({
  name: z.string().trim().min(2, "Name is too short.").max(80),
  phone: z.string().trim().max(30),
  address: z.string().trim().max(500),
  image: z.string().trim().max(2048),
});
type AccountFormValues = z.infer<typeof accountFormSchema>;

export function AccountForm({ defaults }: { defaults: AccountFormValues }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: defaults,
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload: UpdateProfileInput = {
      name: values.name,
      phone: values.phone || undefined,
      address: values.address || undefined,
      image: values.image || undefined,
    };
    const res = await updateUserProfileAction(payload);
    if (!res.ok) {
      const fe = res.error.fieldErrors;
      if (fe) {
        for (const [k, m] of Object.entries(fe)) {
          if (m?.[0]) setError(k as keyof AccountFormValues, { message: m[0] });
        }
      }
      toast.error(res.error.message);
      return;
    }
    toast.success("Profile updated.");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field id="name" label="Full name" error={errors.name?.message}>
        <Input id="name" autoComplete="name" {...register("name")} />
      </Field>
      <Field id="phone" label="Phone" error={errors.phone?.message}>
        <Input id="phone" autoComplete="tel" placeholder="Optional" {...register("phone")} />
      </Field>
      <Field id="address" label="Address" error={errors.address?.message}>
        <Input id="address" autoComplete="street-address" placeholder="Optional" {...register("address")} />
      </Field>
      <Field id="image" label="Avatar image URL" error={errors.image?.message}>
        <Input id="image" placeholder="https://…" {...register("image")} />
      </Field>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Save changes
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}
    </div>
  );
}
