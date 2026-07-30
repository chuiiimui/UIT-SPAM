import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, Kpi, PageHead, Shell, statusTone, btnSecondary } from "@/components/ui";
import { facultyNav } from "@/lib/nav";
import { statusLabel } from "@/lib/constants";

async function facultyGroups(facultyId: number) {
  return prisma.groupMentor.findMany({
    where: { facultyId },
    include: {
      group: { include: { project: true, assessments: true } },
    },
    orderBy: { group: { groupCode: "asc" } },
  });
}

export default async function FacultyDashboard() {
  const session = await auth();
  const facultyId = Number(session!.user.id);
  const mentorships = await facultyGroups(facultyId);
  const groupIds = mentorships.map((m) => m.groupId);

  const pendingReviews = groupIds.length
    ? await prisma.project.count({
        where: { groupId: { in: groupIds }, status: { in: ["submitted", "under_review"] } },
      })
    : 0;
  const assessmentCount = await prisma.assessment.count({ where: { facultyId } });

  return (
    <Shell nav={facultyNav("dash")} user={session!.user}>
      <PageHead
        title="Monitoring & assessment"
        subtitle={`Welcome, ${session!.user.name} · ${session!.user.facultyId}`}
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Kpi label="Assigned groups" value={mentorships.length} />
        <Kpi label="Pending reviews" value={pendingReviews} />
        <Kpi label="Your assessments" value={assessmentCount} />
      </div>
      <Card title="Groups you mentor">
        {!mentorships.length ? (
          <p className="text-muted">No groups assigned yet. The admin will map groups to your faculty ID.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-3">Group</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Avg marks</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {mentorships.map((m) => {
                  const avg =
                    m.group.assessments.length > 0
                      ? Math.round(
                          (m.group.assessments.reduce(
                            (s, a) => s + (a.marks / a.maxMarks) * 100,
                            0,
                          ) /
                            m.group.assessments.length) *
                            10,
                        ) / 10
                      : null;
                  return (
                    <tr key={m.id} className="border-t border-line">
                      <td className="py-3">
                        <strong>{m.group.groupCode}</strong>
                        <div className="text-muted">{m.group.groupName}</div>
                      </td>
                      <td>
                        {m.group.project?.title || "—"}
                        {m.group.project ? (
                          <div className="mt-1">
                            <Badge tone={statusTone(m.group.project.status)}>
                              {statusLabel(m.group.project.status)}
                            </Badge>
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <Badge tone={statusTone(m.group.status)}>{statusLabel(m.group.status)}</Badge>
                      </td>
                      <td>
                        {m.isPrimary ? <Badge tone="ok">Primary</Badge> : <Badge>Co-mentor</Badge>}
                      </td>
                      <td>{avg !== null ? `${avg}%` : "—"}</td>
                      <td>
                        <Link className={btnSecondary + " !py-2 !px-3 text-xs"} href={`/faculty/groups/${m.groupId}`}>
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Shell>
  );
}
