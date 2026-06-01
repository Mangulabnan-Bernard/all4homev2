"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { categorySchema, updateCategorySchema } from "@/lib/validators/categories";
import { idSchema } from "@/lib/validators/common";
import { requireCan } from "@/lib/permissions/guard";
import { writeAuditLog } from "@/lib/audit";
import { ok, fail, failFrom, type Result } from "@/lib/result";

export async function createCategoryAction(input: unknown): Promise<Result<{ id: string }>> {
  try {
    const admin = await requireCan("category:manage");
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const data = parsed.data;
    const existing = await prisma.serviceCategory.findFirst({
      where: { OR: [{ slug: data.slug }, { name: data.name }] },
      select: { id: true },
    });
    if (existing) return fail("CONFLICT", "A category with that name or slug already exists.");
    const category = await prisma.serviceCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        isActive: data.isActive,
      },
      select: { id: true },
    });
    await writeAuditLog({ actorId: admin.id, action: "CREATE", entity: "ServiceCategory", entityId: category.id });
    revalidatePath("/admin/categories");
    return ok({ id: category.id });
  } catch (e) {
    return failFrom(e);
  }
}

export async function updateCategoryAction(input: unknown): Promise<Result<{ id: string }>> {
  try {
    const admin = await requireCan("category:manage");
    const parsed = updateCategorySchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const { id, name, slug, description, icon, isActive } = parsed.data;
    const existing = await prisma.serviceCategory.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return fail("NOT_FOUND", "Category not found.");
    await prisma.serviceCategory.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(icon !== undefined ? { icon } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });
    await writeAuditLog({ actorId: admin.id, action: "UPDATE", entity: "ServiceCategory", entityId: id });
    revalidatePath("/admin/categories");
    return ok({ id });
  } catch (e) {
    return failFrom(e);
  }
}

export async function deleteCategoryAction(input: unknown): Promise<Result<null>> {
  try {
    const admin = await requireCan("category:manage");
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const { id } = parsed.data;
    const count = await prisma.service.count({ where: { categoryId: id } });
    if (count > 0) return fail("CONFLICT", "This category still has services.");
    await prisma.serviceCategory.delete({ where: { id } });
    await writeAuditLog({ actorId: admin.id, action: "DELETE", entity: "ServiceCategory", entityId: id });
    revalidatePath("/admin/categories");
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
