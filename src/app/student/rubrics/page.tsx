import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/map/session";
import { studentNav } from "@/lib/nav";
import { RUBRIC_CODES, RUBRICS } from "@/lib/map/rubrics";
import { RubricCatalog, RubricPanel } from "@/components/rubric-panel";
import { Card, PageHead, Shell } from "@/components/ui";

export default async function StudentRubricsPage() {
  const session = await requireRole("student");
  const student = await prisma.student.findUnique({
    where: { id: Number(session.user.id) },
    include: {
      group: {
        include: {
          students: { orderBy: [{ isLeader: "desc" }, { fullName: "asc" }] },
          rubricStatuses: true,
          rubricMarks: true,
          batch: { include: { rubricDeadlines: true } },
        },
      },
    },
  });

  if (!student) return null;

  const group = student.group;
  const myMarks = group?.rubricMarks.filter((m) => m.studentId === student.id) ?? [];
  const dueMap = new Map(
    (group?.batch.rubricDeadlines ?? []).map((d) => [d.rubricCode, d.dueAt]),
  );

  return (
    <Shell nav={studentNav("rubrics")} user={session.user}>
      <PageHead
        title="Rubrics"
        subtitle="R1–R8 evaluation criteria and your group scores."
        actions={
          group ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/group/${group.id}`}
                className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white no-underline"
              >
                Open group page
              </Link>
              <Link
                href={`/group/${group.id}?summary=1`}
                className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-brand-deep no-underline"
              >
                Project summary
              </Link>
            </div>
          ) : null
        }
      />

      <Card title="Rubric catalog (R1–R8)">
        <RubricCatalog />
      </Card>

      {group ? (
        <>
          <Card title="Your scores">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {RUBRIC_CODES.map((code) => {
                const mark = myMarks.find((m) => m.rubricCode === code);
                const due = dueMap.get(code);
                return (
                  <div key={code} className="rounded-xl border border-line bg-white px-3 py-3 text-sm">
                    <strong>
                      {code} · {RUBRICS[code].title}
                    </strong>
                    <div className="mt-1 text-brand-deep font-semibold">
                      {mark ? mark.marks : "—"} / {RUBRICS[code].maxMarks}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      Due: {due ? new Date(due).toLocaleDateString() : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title={`Group review — ${group.projectTitle}`}>
            <RubricPanel
              groupId={group.id}
              students={group.students}
              statuses={group.rubricStatuses}
              marks={group.rubricMarks}
              canEvaluate={false}
              canUpload={group.status === "active"}
            />
          </Card>
        </>
      ) : (
        <Card>
          <p className="m-0 text-muted">
            Join or create a group to see live rubric scores.{" "}
            <Link href="/student" className="font-semibold text-brand no-underline">
              Go to Home →
            </Link>
          </p>
        </Card>
      )}
    </Shell>
  );
}
