import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

function oauthConfig() {
  return {
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    github: Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET),
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">Sign in to your All4Home account.</p>
      <div className="mt-6">
        <LoginForm callbackUrl={callbackUrl} oauth={oauthConfig()} />
      </div>
    </div>
  );
}
