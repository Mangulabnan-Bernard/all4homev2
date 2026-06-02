import type { Metadata } from "next";
import Link from "next/link";
import type { UserRole } from "@prisma/client";

import { auth } from "@/auth";
import { getAllUsers } from "@/features/admin/queries";
import { PageHeader } from "@/components/layout/page-header";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS } from "@/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Users" };
export const dynamic = "force-dynamic";

const ROLE_TABS = ["ALL", "CUSTOMER", "PROVIDER", "ADMIN"] as const;

function qs(params: Record<string, string | number | undefined>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : "";
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const currentUserId = session?.user?.id;

  const role: UserRole | undefined =
    sp.role === "CUSTOMER" || sp.role === "PROVIDER" || sp.role === "ADMIN" ? sp.role : undefined;
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1;
  const { items, hasMore } = await getAllUsers({ q: sp.q || undefined, role, page });

  return (
    <div>
      <PageHeader title="Users" description="Manage accounts, roles, and access." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {ROLE_TABS.map((t) => {
            const active = t === "ALL" ? !role : role === t;
            return (
              <Link
                key={t}
                href={`/admin/users${qs({ q: sp.q, role: t === "ALL" ? undefined : t })}`}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium transition",
                  active
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                )}
              >
                {t === "ALL" ? "All" : ROLE_LABELS[t]}
              </Link>
            );
          })}
        </div>
        <form className="flex gap-2">
          {role && <input type="hidden" name="role" value={role} />}
          <Input name="q" placeholder="Search name or email" defaultValue={sp.q ?? ""} className="h-9 w-56" />
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--accent)] text-left text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[var(--muted-foreground)]">
                  No users found.
                </td>
              </tr>
            ) : (
              items.map((u) => (
                <tr key={u.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.name ?? "—"}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        u.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
                      )}
                    >
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <UserRowActions
                      userId={u.id}
                      role={u.role}
                      isActive={u.isActive}
                      isSelf={u.id === currentUserId}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(page > 1 || hasMore) && (
        <div className="mt-4 flex items-center justify-between">
          {page > 1 ? (
            <Link
              href={`/admin/users${qs({ q: sp.q, role, page: page - 1 })}`}
              className="text-sm font-medium text-[var(--primary)] hover:underline"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-[var(--muted-foreground)]">Page {page}</span>
          {hasMore ? (
            <Link
              href={`/admin/users${qs({ q: sp.q, role, page: page + 1 })}`}
              className="text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
