import { prisma } from "@/lib/prisma";
import type { AuditAction, Prisma } from "@prisma/client";

interface AuditInput {
  actorId?: string | null; // null for system actions
  action: AuditAction;
  entity: string; // "Booking" | "User" | "Payment" | ...
  entityId: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}

/**
 * Append an immutable audit entry. Pass the transaction client (`tx`) when the
 * audit must commit atomically with its triggering mutation; otherwise it uses
 * the global client.
 */
export async function writeAuditLog(
  input: AuditInput,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx ?? prisma;
  await client.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      ipAddress: input.ipAddress ?? null,
    },
  });
}
