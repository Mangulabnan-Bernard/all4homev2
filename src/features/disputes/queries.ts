import { prisma } from "@/lib/prisma";
import type { AdminDisputeDTO } from "@/types/dto";

const DISPUTE_INCLUDE = {
  raisedBy: { select: { name: true } },
} as const;

type DisputeRow = {
  id: string;
  status: AdminDisputeDTO["status"];
  reason: string;
  resolution: string | null;
  bookingId: string;
  createdAt: Date;
  raisedBy: { name: string | null };
};

function toDTO(d: DisputeRow): AdminDisputeDTO {
  return {
    id: d.id,
    status: d.status,
    reason: d.reason,
    resolution: d.resolution,
    bookingId: d.bookingId,
    raisedByName: d.raisedBy.name,
    createdAt: d.createdAt.toISOString(),
  };
}

/** All disputes (newest first) for the admin queue. */
export async function getDisputes(): Promise<AdminDisputeDTO[]> {
  const rows = await prisma.dispute.findMany({
    orderBy: { createdAt: "desc" },
    include: DISPUTE_INCLUDE,
  });
  return rows.map(toDTO);
}

/** A single dispute by id, or null if it does not exist. */
export async function getDisputeById(id: string): Promise<AdminDisputeDTO | null> {
  const d = await prisma.dispute.findUnique({
    where: { id },
    include: DISPUTE_INCLUDE,
  });
  if (!d) return null;
  return toDTO(d);
}
