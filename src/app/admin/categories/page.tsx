import type { Metadata } from "next";

import { listAllCategories } from "@/features/categories/queries";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata: Metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await listAllCategories();

  return (
    <div>
      <PageHeader title="Categories" description="Service categories shown across the platform." />
      <CategoryManager categories={categories} />
    </div>
  );
}
