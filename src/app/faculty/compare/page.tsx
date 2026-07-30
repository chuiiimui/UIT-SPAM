import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { facultyNav } from "@/lib/nav";
import { Card, Kpi, PageHead, Shell } from "@/components/ui";

export default async function FacultyComparePage() {
  const session = await auth();
  const mentorships = await prisma.groupMentor.findMany({
    where: { facultyId: Number(session!.user.id) },
    include: {
      group: {
        include: {
          assessments: true,
          submissions: true,
          contributions: true,
          project: true,
          students: true,
        },
      },
    },
  });

  return (
    <Shell nav={facultyNav("compare")} user={session!.user}>
      <PageHead title="Compare groups" subtitle="Progress heatmap across your mentored teams." />
      <div className="grid gap-4">
        {mentorships.map((m) => {
          const avg =
            m.group.assessments.length > 0
              ? Math.round(
                  (m.group.assessments.reduce((s, a) => s + (a.marks / a.maxMarks) * 100, 0) /
                    m.group.assessments.length) *
                    10,
                ) / 10
              : null;
          return (
            <Card key={m.id} title={`${m.group.groupCode} · ${m.group.groupName || ""}`}>
              <div className="grid gap-3 sm:grid-cols-4">
                <Kpi label="Members" value={m.group.students.length} />
                <Kpi label="Submissions" value={m.group.submissions.length} />
                <Kpi label="Contribution logs" value={m.group.contributions.length} />
                <Kpi label="Avg marks" value={avg !== null ? `${avg}%` : "—"} />
              </div>
              <p className="mt-3 mb-0 text-sm text-muted">
                Project: {m.group.project?.title || "Not created"} · status{" "}
                {m.group.project?.status || "—"}
              </p>
            </Card>
          );
        })}
      </div>
    </Shell>
  );
}
