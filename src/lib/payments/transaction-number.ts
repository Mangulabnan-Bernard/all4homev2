import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Concurrency-safe daily transaction number: TRX-YYYYMMDD-NNNNNN.
 *
 * Uses an atomic INSERT ... ON DUPLICATE KEY UPDATE on `transaction_counters`
 * with connection-scoped LAST_INSERT_ID, so concurrent same-day callers each
 * get a distinct sequence value. The row lock is held until the surrounding
 * `$transaction` commits; `Payment.transactionNumber @unique` is the backstop.
 * Must be called INSIDE a prisma.$transaction (pass the tx client).
 */
export async function nextTransactionNumber(tx: Tx): Promise<string> {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  await tx.$executeRaw`
    INSERT INTO transaction_counters (day, seq)
    VALUES (${day}, LAST_INSERT_ID(1))
    ON DUPLICATE KEY UPDATE seq = LAST_INSERT_ID(seq + 1)`;
  const rows = await tx.$queryRaw<{ seq: bigint }[]>`SELECT LAST_INSERT_ID() AS seq`;
  return `TRX-${day}-${String(Number(rows[0].seq)).padStart(6, "0")}`;
}
