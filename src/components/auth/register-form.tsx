"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { registerSchema, type RegisterInput } from "@/lib/validators/auth";
import { registerAction } from "@/actions/auth/register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { OAuthButtons } from "./oauth-buttons";

const ROLE_OPTIONS = [
  { value: "CUSTOMER", label: "I need a service", hint: "Book trusted home pros" },
  { value: "PROVIDER", label: "I'm a provider", hint: "Offer your services" },
] as const;

export function RegisterForm({
  callbackUrl,
  oauth,
}: {
  callbackUrl?: string;
  oauth: { google: boolean; github: boolean };
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: "CUSTOMER" },
  });
  // Local mirror of the role field drives the selector UI (avoids RHF watch()).
  const [role, setRole] = React.useState<RegisterInput["role"]>("CUSTOMER");

  const onSubmit = handleSubmit(async (values) => {
    const res = await registerAction(values);
    if (!res.ok) {
      const fieldErrors = res.error.fieldErrors;
      if (fieldErrors) {
        for (const [key, messages] of Object.entries(fieldErrors)) {
          if (messages?.[0]) setError(key as keyof RegisterInput, { message: messages[0] });
        }
      }
      toast.error(res.error.message);
      return;
    }
    // Auto sign-in after successful registration.
    await signIn("credentials", { email: values.email, password: values.password, redirect: false });
    toast.success("Account created — welcome to All4Home!");
    router.push(callbackUrl || "/");
    router.refresh();
  });

  return (
    <div className="space-y-6">
      <OAuthButtons google={oauth.google} github={oauth.github} callbackUrl={callbackUrl} />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-2">
          {ROLE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                setRole(o.value);
                setValue("role", o.value, { shouldValidate: true });
              }}
              aria-pressed={role === o.value}
              className={cn(
                "rounded-lg border p-3 text-left transition",
                role === o.value
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "border-[var(--border)] hover:bg-[var(--accent)]",
              )}
            >
              <span className="block text-sm font-medium">{o.label}</span>
              <span className="block text-xs text-[var(--muted-foreground)]">{o.hint}</span>
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" autoComplete="name" aria-invalid={Boolean(errors.name)} {...register("name")} />
          {errors.name && <p className="text-xs text-[var(--destructive)]">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-[var(--destructive)]">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-[var(--destructive)]">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
