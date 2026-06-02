import type { Metadata } from "next";

import { getPendingProviders } from "@/features/providers/queries";
import { PageHeader } from "@/components/layout/page-header";
import { ProviderApprovalActions } from "@/components/admin/provider-approval-actions";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Provider approvals" };
export const dynamic = "force-dynamic";

export default async function AdminProvidersPage() {
  const pending = await getPendingProviders();

  return (
    <div>
      <PageHeader
        title="Provider approvals"
        description="Applications awaiting review, oldest first."
      />

      {pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">No pending applications.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {pending.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="min-w-0">
                <p className="font-medium">{p.name ?? "—"}</p>
                <p className="text-sm text-[var(--muted-foreground)]">{p.email}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {p.categoryName ?? "No category"} · {p.documentCount} document
                  {p.documentCount === 1 ? "" : "s"} · applied {formatDate(p.createdAt)}
                </p>
              </div>
              <ProviderApprovalActions profileId={p.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
