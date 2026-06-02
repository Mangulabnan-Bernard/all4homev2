import type { Metadata } from "next";

import { getAuditLogs } from "@/features/admin/queries";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Audit logs" };
export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  const logs = await getAuditLogs();

  return (
    <div>
      <PageHeader title="Audit logs" description="The 100 most recent administrative actions." />

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--accent)] text-left text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
            <tr>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Entity</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[var(--muted-foreground)]">
                  No audit entries yet.
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 font-mono text-xs">
                      {l.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{l.entity}</span>
                    <span className="ml-1 font-mono text-xs text-[var(--muted-foreground)]">
                      {l.entityId.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{l.actorName ?? "System"}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    {formatDateTime(l.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
