import type { Metadata } from "next";

import { getAdminPayments } from "@/features/admin/queries";
import { PageHeader } from "@/components/layout/page-header";
import { RefundButton } from "@/components/admin/refund-button";
import { PAYMENT_STATUS_META } from "@/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Payments" };
export const dynamic = "force-dynamic";

const METHOD_LABEL: Record<string, string> = {
  SIMULATED_CARD: "Card",
  SIMULATED_WALLET: "Wallet",
  SIMULATED_BANK: "Bank",
};

export default async function AdminPaymentsPage() {
  const payments = await getAdminPayments();

  return (
    <div>
      <PageHeader title="Payments" description="The 100 most recent transactions." />

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--accent)] text-left text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
            <tr>
              <th className="px-4 py-3 font-medium">Transaction</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[var(--muted-foreground)]">
                  No payments yet.
                </td>
              </tr>
            ) : (
              payments.map((p) => {
                const meta = PAYMENT_STATUS_META[p.status];
                return (
                  <tr key={p.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 font-mono text-xs">{p.transactionNumber}</td>
                    <td className="px-4 py-3">{p.customerName ?? "—"}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">
                      {METHOD_LABEL[p.method] ?? p.method}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          meta.className,
                        )}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {p.status === "COMPLETED" ? <RefundButton bookingId={p.bookingId} /> : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
