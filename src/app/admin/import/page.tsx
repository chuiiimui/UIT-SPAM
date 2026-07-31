import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/map/session";
import { adminNav } from "@/lib/nav";
import { BulkImportForm } from "@/components/admin-user-forms";
import { Card, PageHead, Shell } from "@/components/ui";

export default async function AdminImportPage() {
  const session = await requireRole("admin");
  const batches = await prisma.batch.findMany({ orderBy: { endYear: "desc" } });

  return (
    <Shell nav={adminNav("import")} user={session.user}>
      <PageHead
        title="Bulk import students"
        subtitle="Upload or paste a CSV of AKTU rolls to register an entire batch."
        actions={
          <Link
            href="/admin/students"
            className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-brand-deep no-underline"
          >
            Single student form
          </Link>
        }
      />

      <Card title="CSV import">
        <p className="mt-0 text-sm text-muted">
          Columns: <code>uniqueId,fullName,email,phone</code>. Header row optional. Invalid rolls and
          duplicates are skipped. New accounts get the default password below and must complete
          biodata on first login.
        </p>
        {batches.length ? (
          <BulkImportForm batches={batches.map((b) => ({ id: b.id, label: b.label }))} />
        ) : (
          <p className="mb-0 text-sm text-danger">Create a batch before importing students.</p>
        )}
      </Card>
    </Shell>
  );
}
