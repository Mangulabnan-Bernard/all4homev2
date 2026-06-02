import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getMyProviderProfile, getMyDocuments } from "@/features/providers/queries";
import { PageHeader } from "@/components/layout/page-header";
import { DocumentsManager } from "@/components/providers/documents-manager";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

export default async function ProviderDocumentsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(ROUTES.login);

  const [profile, documents] = await Promise.all([
    getMyProviderProfile(userId),
    getMyDocuments(userId),
  ]);

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Upload verification documents for admin review."
      />
      {profile ? (
        <DocumentsManager documents={documents} />
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Set up your provider profile before uploading documents.
          </p>
          <Link href={ROUTES.provider.apply} className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
            Start your application
          </Link>
        </div>
      )}
    </div>
  );
}
