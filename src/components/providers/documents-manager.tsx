"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ExternalLink, FileText, Loader2, ShieldCheck, Upload } from "lucide-react";
import type { DocumentType } from "@prisma/client";

import { documentSchema, type DocumentInput } from "@/lib/validators/providers";
import { uploadDocumentAction } from "@/actions/providers/upload-document";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/format";

const DOC_LABELS: Record<DocumentType, string> = {
  ID_CARD: "ID card",
  PASSPORT: "Passport",
  DRIVERS_LICENSE: "Driver's license",
  BUSINESS_LICENSE: "Business license",
  CERTIFICATION: "Certification",
  INSURANCE: "Insurance",
  PROOF_OF_ADDRESS: "Proof of address",
};
const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

type Doc = {
  id: string;
  type: DocumentType;
  url: string;
  verified: boolean;
  createdAt: string;
};

export function DocumentsManager({ documents }: { documents: Doc[] }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DocumentInput>({
    resolver: zodResolver(documentSchema),
    defaultValues: { type: "ID_CARD", url: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const res = await uploadDocumentAction(values);
    if (!res.ok) {
      const fe = res.error.fieldErrors;
      if (fe) {
        for (const [k, m] of Object.entries(fe)) {
          if (m?.[0]) setError(k as keyof DocumentInput, { message: m[0] });
        }
      }
      toast.error(res.error.message);
      return;
    }
    toast.success("Document added.");
    reset({ type: "ID_CARD", url: "" });
    router.refresh();
  });

  return (
    <div className="space-y-6">
      {documents.length > 0 && (
        <ul className="space-y-2">
          {documents.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="size-5 shrink-0 text-[var(--muted-foreground)]" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{DOC_LABELS[d.type]}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Added {formatDate(d.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {d.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    <ShieldCheck className="size-3" />
                    Verified
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    Pending
                  </span>
                )}
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open document"
                  className="text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
                >
                  <ExternalLink className="size-4" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
        noValidate
      >
        <h3 className="font-medium">Add a document</h3>
        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <select id="type" className={SELECT_CLASS} {...register("type")}>
            {Object.entries(DOC_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="url">File URL</Label>
          <Input id="url" placeholder="https://…" {...register("url")} />
          {errors.url && <p className="text-xs text-[var(--destructive)]">{errors.url.message}</p>}
        </div>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Upload
        </Button>
      </form>
    </div>
  );
}
