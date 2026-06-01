import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Invalid reset link</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          This link is missing its token or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-sm font-medium text-[var(--primary)] hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Choose a strong password you don&apos;t use elsewhere.
      </p>
      <div className="mt-6">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
