import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MILESTONES } from "@/lib/constants";
import { Card, Kpi, PageHead, Shell } from "@/components/ui";
import { format } from "date-fns";

import { studentNav } from "@/lib/nav";

export default async function StudentMarksPage() {
  const session = await auth();
  const student = await prisma.student.findUnique({ where: { id: Number(session!.user.id) } });
  const groupId = student?.groupId;

  const assessments = groupId
    ? await prisma.assessment.findMany({
        where: { groupId },
        include: { faculty: true, student: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const vivaScores = groupId
    ? await prisma.vivaScore.findMany({
        where: { groupId },
        include: { faculty: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const rubricScores = groupId
    ? await prisma.rubricScore.findMany({
        where: { groupId },
        include: { criterion: true, faculty: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];

  const contrib = groupId
    ? await prisma.student.findMany({
        where: { groupId },
        include: { assessments: true },
        orderBy: [{ isLeader: "desc" }, { fullName: "asc" }],
      })
    : [];

  const avg =
    assessments.length > 0
      ? Math.round(
          (assessments.reduce((s, a) => s + (a.marks / a.maxMarks) * 100, 0) / assessments.length) *
            10,
        ) / 10
      : null;

  return (
    <Shell nav={studentNav("marks")} user={session!.user}>
      <PageHead title="Marks & contribution" subtitle="Faculty assessments for your group and individual members." />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Kpi label="Group average" value={avg !== null ? `${avg}%` : "—"} />
        <Kpi label="Assessments" value={assessments.length} />
        <Kpi label="Your ID" value={session!.user.studentId || "—"} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Assessment history">
          {!assessments.length ? (
            <p className="text-muted">No marks recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th className="py-3">Date</th>
                    <th>Faculty</th>
                    <th>Target</th>
                    <th>Milestone</th>
                    <th>Marks</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a) => (
                    <tr key={a.id} className="border-t border-line">
                      <td className="py-3">{format(a.createdAt, "dd MMM yyyy")}</td>
                      <td>{a.faculty.fullName}</td>
                      <td>{a.student?.fullName || "Whole group"}</td>
                      <td>{a.milestone ? MILESTONES[a.milestone] || a.milestone : "—"}</td>
                      <td>
                        <strong>{a.marks}</strong> / {a.maxMarks}
                      </td>
                      <td className="text-muted">{a.contributionNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card title="Member contribution">
          {contrib.map((c) => {
            const pct =
              c.assessments.length > 0
                ? Math.round(
                    (c.assessments.reduce((s, a) => s + (a.marks / a.maxMarks) * 100, 0) /
                      c.assessments.length) *
                      10,
                  ) / 10
                : null;
            return (
              <div key={c.id} className="flex justify-between border-b border-line py-2.5 last:border-0">
                <span>
                  {c.fullName}
                  {c.id === Number(session!.user.id) ? " (you)" : ""}
                </span>
                <strong>{pct !== null ? `${pct}%` : "—"}</strong>
              </div>
            );
          })}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Viva scores">
          {!vivaScores.length ? (
            <p className="text-muted">No viva scores yet.</p>
          ) : (
            vivaScores.map((v) => (
              <div key={v.id} className="border-b border-line py-2 last:border-0 text-sm">
                <strong>
                  {v.round} · {v.marks}/{v.maxMarks}
                </strong>{" "}
                by {v.faculty.fullName}
                <div className="text-muted">{v.notes}</div>
              </div>
            ))
          )}
        </Card>
        <Card title="Rubric scores">
          {!rubricScores.length ? (
            <p className="text-muted">No rubric scores yet.</p>
          ) : (
            rubricScores.map((r) => (
              <div key={r.id} className="border-b border-line py-2 last:border-0 text-sm">
                <strong>
                  {r.criterion.label}: {r.marks}/{r.criterion.maxMarks}
                </strong>
                <div className="text-muted">
                  {r.faculty.fullName}
                  {r.note ? ` · ${r.note}` : ""}
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </Shell>
  );
}
