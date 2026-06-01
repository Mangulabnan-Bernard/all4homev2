import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/format";
import type {
  PendingProviderDTO,
  ProviderCardDTO,
  ProviderDetailDTO,
  ServiceDTO,
} from "@/types/dto";
import type { SearchProvidersInput } from "@/lib/validators/providers";

const PAGE_SIZE = 12;

/** Public, paginated provider search. Only APPROVED + active providers are listed. */
export async function searchProviders(
  input: SearchProvidersInput,
): Promise<{ items: ProviderCardDTO[]; page: number; hasMore: boolean }> {
  const where: Prisma.ProviderProfileWhereInput = {
    verificationStatus: "APPROVED",
    user: { isActive: true },
  };
  if (input.categorySlug) where.category = { slug: input.categorySlug };
  if (typeof input.minRating === "number") where.averageRating = { gte: input.minRating };
  if (typeof input.maxPrice === "number") where.hourlyRate = { lte: input.maxPrice };
  if (input.q) {
    where.OR = [{ user: { name: { contains: input.q } } }, { bio: { contains: input.q } }];
  }

  const orderBy: Prisma.ProviderProfileOrderByWithRelationInput =
    input.sort === "price-asc"
      ? { hourlyRate: "asc" }
      : input.sort === "price-desc"
        ? { hourlyRate: "desc" }
        : input.sort === "newest"
          ? { createdAt: "desc" }
          : { averageRating: "desc" };

  const rows = await prisma.providerProfile.findMany({
    where,
    orderBy,
    skip: (input.page - 1) * PAGE_SIZE,
    take: PAGE_SIZE + 1,
    include: {
      user: { select: { name: true, image: true } },
      category: { select: { name: true, slug: true } },
      services: {
        where: { isActive: true },
        select: { price: true },
        orderBy: { price: "asc" },
        take: 1,
      },
    },
  });

  const hasMore = rows.length > PAGE_SIZE;
  const items: ProviderCardDTO[] = rows.slice(0, PAGE_SIZE).map((p) => {
    const hourly = decimalToNumber(p.hourlyRate);
    const cheapest = p.services[0]?.price;
    return {
      id: p.id,
      userId: p.userId,
      name: p.user.name,
      image: p.user.image,
      bio: p.bio,
      categoryName: p.category?.name ?? null,
      categorySlug: p.category?.slug ?? null,
      hourlyRate: hourly,
      averageRating: p.averageRating,
      reviewCount: p.reviewCount,
      experienceYears: p.experienceYears,
      fromPrice: cheapest != null ? decimalToNumber(cheapest) : hourly,
    };
  });

  return { items, page: input.page, hasMore };
}

/** Public provider profile (APPROVED + active only). Returns null otherwise. */
export async function getProviderById(id: string): Promise<ProviderDetailDTO | null> {
  const p = await prisma.providerProfile.findFirst({
    where: { id, verificationStatus: "APPROVED", user: { isActive: true } },
    include: {
      user: { select: { name: true, image: true } },
      category: { select: { name: true, slug: true } },
      services: { where: { isActive: true }, orderBy: { price: "asc" } },
    },
  });
  if (!p) return null;

  const services: ServiceDTO[] = p.services.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    price: decimalToNumber(s.price),
    durationMin: s.durationMin,
    categoryId: s.categoryId,
    isActive: s.isActive,
  }));
  const hourly = decimalToNumber(p.hourlyRate);

  return {
    id: p.id,
    userId: p.userId,
    name: p.user.name,
    image: p.user.image,
    bio: p.bio,
    description: p.description,
    categoryName: p.category?.name ?? null,
    categorySlug: p.category?.slug ?? null,
    hourlyRate: hourly,
    averageRating: p.averageRating,
    reviewCount: p.reviewCount,
    experienceYears: p.experienceYears,
    serviceRadiusKm: p.serviceRadiusKm,
    verificationStatus: p.verificationStatus,
    fromPrice: services[0]?.price ?? hourly,
    services,
  };
}

/** The signed-in provider's own profile + services (any verification status). */
export async function getMyProviderProfile(userId: string): Promise<ProviderDetailDTO | null> {
  const p = await prisma.providerProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, image: true } },
      category: { select: { name: true, slug: true } },
      services: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!p) return null;

  const services: ServiceDTO[] = p.services.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    price: decimalToNumber(s.price),
    durationMin: s.durationMin,
    categoryId: s.categoryId,
    isActive: s.isActive,
  }));
  const hourly = decimalToNumber(p.hourlyRate);

  return {
    id: p.id,
    userId: p.userId,
    name: p.user.name,
    image: p.user.image,
    bio: p.bio,
    description: p.description,
    categoryName: p.category?.name ?? null,
    categorySlug: p.category?.slug ?? null,
    hourlyRate: hourly,
    averageRating: p.averageRating,
    reviewCount: p.reviewCount,
    experienceYears: p.experienceYears,
    serviceRadiusKm: p.serviceRadiusKm,
    verificationStatus: p.verificationStatus,
    fromPrice: services.filter((s) => s.isActive)[0]?.price ?? hourly,
    services,
  };
}

/** Admin approval queue. */
export async function getPendingProviders(): Promise<PendingProviderDTO[]> {
  const rows = await prisma.providerProfile.findMany({
    where: { verificationStatus: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { name: true, email: true } },
      category: { select: { name: true } },
      _count: { select: { documents: true } },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    userId: p.userId,
    name: p.user.name,
    email: p.user.email,
    categoryName: p.category?.name ?? null,
    createdAt: p.createdAt.toISOString(),
    documentCount: p._count.documents,
  }));
}
