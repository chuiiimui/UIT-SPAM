import { auth } from "@/auth";
import { bulkImportStudents } from "@/lib/features/actions";
import { adminNav } from "@/lib/nav";
import { btnPrimary, Card, Field, inputClass, PageHead, Shell } from "@/components/ui";

export default async function AdminImportPage() {
  const session = await auth();

  return (
    <Shell nav={adminNav("import")} user={session!.user}>
      <PageHead title="Bulk onboarding" subtitle="CSV import for students (password defaults to password123)." />
      <Card title="Import students CSV">
        <p className="text-sm text-muted">
          Header required:{" "}
          <code>studentId,username,fullName,email,department,enrollmentNo,groupCode,isLeader</code>
        </p>
        <form action={bulkImportStudents} className="mt-4">
          <Field label="CSV content">
            <textarea
              className={inputClass}
              name="csv"
              rows={12}
              defaultValue={`studentId,username,fullName,email,department,enrollmentNo,groupCode,isLeader
STU100,stu_new1,New Student,new@student.uit.edu,Computer Science,ENR21100,GRP-2026-003,0`}
            />
          </Field>
          <button className={btnPrimary} type="submit">
            Import students
          </button>
        </form>
      </Card>
    </Shell>
  );
}
