import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Concurrency-safe daily transaction number: TRX-YYYYMMDD-NNNNNN.
 *
 * Atomic upsert on `transaction_counters` (PK `day`): INSERT ... ON CONFLICT
 * DO UPDATE ... RETURNING bumps and returns the day's sequence in a single
 * statement. The row lock is held until the surrounding `$transaction` commits,
 * so concurrent same-day callers serialize; `Payment.transactionNumber @unique`
 * is the backstop. Must be called INSIDE a prisma.$transaction (pass the tx client).
 */
export async function nextTransactionNumber(tx: Tx): Promise<string> {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const rows = await tx.$queryRaw<{ seq: number }[]>`
    INSERT INTO transaction_counters (day, seq)
    VALUES (${day}, 1)
    ON CONFLICT (day) DO UPDATE SET seq = transaction_counters.seq + 1
    RETURNING seq`;
  return `TRX-${day}-${String(Number(rows[0].seq)).padStart(6, "0")}`;
}
