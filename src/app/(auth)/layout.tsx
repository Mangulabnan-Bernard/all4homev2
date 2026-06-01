import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { APP_NAME, dashboardForRole } from "@/constants";

/** Centered auth shell. Already-authenticated users are bounced to their dashboard. */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user) redirect(dashboardForRole(session.user.role));

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--accent)]/30 px-6 py-12">
      <Link href="/" className="mb-6 flex items-center gap-2 text-xl font-bold">
        <span className="grid size-8 place-items-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
          A
        </span>
        {APP_NAME}
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-[var(--card-foreground)] shadow-sm">
        {children}
      </div>
    </div>
  );
}
