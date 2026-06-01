"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";

import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validators/auth";
import { forgotPasswordAction } from "@/actions/auth/forgot-password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [sent, setSent] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const res = await forgotPasswordAction(values);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    setSent(true);
  });

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-green-100 text-green-700">
          <MailCheck className="size-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Check your email</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          If an account exists for that address, we&apos;ve sent a reset link. It expires in 30
          minutes.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-[var(--primary)] hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending…
          </>
        ) : (
          "Send reset link"
        )}
      </Button>
      <p className="text-center text-sm text-[var(--muted-foreground)]">
        <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
