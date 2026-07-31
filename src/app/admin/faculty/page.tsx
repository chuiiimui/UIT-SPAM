import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/map/session";
import { adminNav } from "@/lib/nav";
import { CreateFacultyForm, ResetPasswordForm } from "@/components/admin-user-forms";
import { Card, PageHead, Shell } from "@/components/ui";

export default async function AdminFacultyPage() {
  const session = await requireRole("admin");
  const faculty = await prisma.faculty.findMany({
    include: { mentorships: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <Shell nav={adminNav("faculty")} user={session.user}>
      <PageHead
        title="Faculty / Mentors"
        subtitle="Add supervisors who can evaluate weekly diary and rubrics."
      />

      <Card title="Add faculty">
        <CreateFacultyForm />
      </Card>

      <Card title="Faculty list">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-3">Unique Id</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Department</th>
                <th className="py-2 pr-3">Groups</th>
                <th className="py-2">Reset password</th>
              </tr>
            </thead>
            <tbody>
              {faculty.map((f) => (
                <tr key={f.id} className="border-b border-line/70">
                  <td className="py-2 pr-3 font-medium">{f.uniqueId}</td>
                  <td className="py-2 pr-3">{f.fullName}</td>
                  <td className="py-2 pr-3">{f.department ?? "—"}</td>
                  <td className="py-2 pr-3">{f.mentorships.length}</td>
                  <td className="py-2">
                    <ResetPasswordForm role="faculty" targetId={f.id} />
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
