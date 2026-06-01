import { prisma } from "@/lib/prisma";

/** Public, active service categories for the marketing/booking UI. */
export async function listCategories(): Promise<
  { id: string; name: string; slug: string; icon: string | null }[]
> {
  return prisma.serviceCategory.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, icon: true },
  });
}

/** Admin category list with service counts (includes inactive categories). */
export async function listAllCategories(): Promise<
  {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    isActive: boolean;
    serviceCount: number;
  }[]
> {
  const rows = await prisma.serviceCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { services: true } } },
  });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    isActive: c.isActive,
    serviceCount: c._count.services,
  }));
}
