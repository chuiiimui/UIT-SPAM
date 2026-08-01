import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/map/session";
import { adminNav } from "@/lib/nav";
import { CreateStudentForm, ResetPasswordForm } from "@/components/admin-user-forms";
import { StudentNameLink } from "@/components/student-name-link";
import { Card, PageHead, Shell } from "@/components/ui";

export default async function AdminStudentsPage() {
  const session = await requireRole("admin");
  const [batches, students] = await Promise.all([
    prisma.batch.findMany({ orderBy: { endYear: "desc" } }),
    prisma.student.findMany({
      include: { batch: true, group: true },
      orderBy: { uniqueId: "asc" },
      take: 200,
    }),
  ]);

  return (
    <Shell nav={adminNav("students")} user={session.user}>
      <PageHead
        title="Students"
        subtitle="Register students with AKTU roll as Unique Id."
        actions={
          <Link
            href="/admin/import"
            className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white no-underline"
          >
            Bulk CSV import
          </Link>
        }
      />

      <Card title="Add student">
        <CreateStudentForm batches={batches.map((b) => ({ id: b.id, label: b.label }))} />
      </Card>

      <Card title="Registered students">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-3">Roll</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Batch</th>
                <th className="py-2 pr-3">Biodata</th>
                <th className="py-2 pr-3">Group</th>
                <th className="py-2">Reset password</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-line/70">
                  <td className="py-2 pr-3 font-medium">{s.uniqueId}</td>
                  <td className="py-2 pr-3">
                    <StudentNameLink studentId={s.id} name={s.fullName} />
                  </td>
                  <td className="py-2 pr-3">{s.batch?.label ?? "—"}</td>
                  <td className="py-2 pr-3">{s.biodataComplete ? "Complete" : "Pending"}</td>
                  <td className="py-2 pr-3">{s.group?.groupCode ?? "—"}</td>
                  <td className="py-2">
                    <ResetPasswordForm role="student" targetId={s.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}
