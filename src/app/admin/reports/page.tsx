import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, PageHead, Shell, statusTone } from "@/components/ui";
import { adminNav } from "@/lib/nav";
import { statusLabel } from "@/lib/constants";

export default async function AdminReportsPage() {
  const session = await auth();
  const report = await prisma.projectGroup.findMany({
    include: {
      project: true,
      students: true,
      assessments: true,
      mentors: { where: { isPrimary: true }, include: { faculty: true } },
      _count: {
        select: {
          students: true,
        },
      },
    },
    orderBy: { groupCode: "asc" },
  });

  const updateCounts = await prisma.progressUpdate.groupBy({
    by: ["projectId"],
    _count: true,
  });
  const updateMap = Object.fromEntries(updateCounts.map((u) => [u.projectId, u._count]));

  return (
    <Shell nav={adminNav("reports")} user={session!.user}>
      <PageHead
        title="Campus reports"
        subtitle="Cohort-wide view of progress, mentoring coverage, and assessment averages."
      />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-3">Group</th>
                <th>Dept</th>
                <th>Mentor</th>
                <th>Members</th>
                <th>Project</th>
                <th>Updates</th>
                <th>Avg marks</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.map((r) => {
                const avg =
                  r.assessments.length > 0
                    ? Math.round(
                        (r.assessments.reduce((s, a) => s + (a.marks / a.maxMarks) * 100, 0) /
                          r.assessments.length) *
                          10,
                      ) / 10
                    : null;
                return (
                  <tr key={r.id} className="border-t border-line">
                    <td className="py-3">
                      <strong>{r.groupCode}</strong>
                      <div className="text-muted">{r.groupName}</div>
                    </td>
                    <td>{r.department}</td>
                    <td>{r.mentors[0]?.faculty.fullName || "Unassigned"}</td>
                    <td>{r._count.students}</td>
                    <td>
                      {r.project?.title || "—"}
                      {r.project ? (
                        <div className="mt-1">
                          <Badge tone={statusTone(r.project.status)}>
                            {statusLabel(r.project.status)}
                          </Badge>
                        </div>
                      ) : null}
                    </td>
                    <td>{r.project ? updateMap[r.project.id] || 0 : 0}</td>
                    <td>{avg !== null ? `${avg}%` : "—"}</td>
                    <td>
                      <Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}
