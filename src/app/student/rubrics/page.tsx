import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/map/session";
import { studentNav } from "@/lib/nav";
import {
  isRubricInActiveWindow,
  nextLockedRubric,
  RUBRICS,
  visibleRubricCodes,
} from "@/lib/map/rubrics";
import { RubricCatalog, RubricPanel } from "@/components/rubric-panel";
import { Badge, Card, PageHead, Shell } from "@/components/ui";

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
  const deadlines = group?.batch.rubricDeadlines ?? [];
  const visible = visibleRubricCodes(deadlines);
  const next = nextLockedRubric(deadlines);
  const myMarks = group?.rubricMarks.filter((m) => m.studentId === student.id) ?? [];
  const scheduleMap = new Map(deadlines.map((d) => [d.rubricCode, d]));

  return (
    <Shell nav={studentNav("rubrics")} user={session.user}>
      <PageHead
        title="Rubrics"
        subtitle="Only timeline-open rubrics are shown. Future ones unlock when admin’s schedule opens them."
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

      {next ? (
        <Card>
          <p className="m-0 text-sm text-ink-soft">
            Next unlock: <strong>{next.rubricCode}</strong> opens{" "}
            <strong>{new Date(next.openAt).toLocaleString()}</strong>
            {visible.length ? (
              <>
                {" "}
                · Currently open:{" "}
                {visible.map((c) => (
                  <Badge key={c} tone={isRubricInActiveWindow(scheduleMap.get(c)) ? "ok" : "muted"}>
                    {c}
                  </Badge>
                ))}
              </>
            ) : null}
          </p>
        </Card>
      ) : null}

      <Card title={visible.length ? `Open rubrics (${visible.join(", ")})` : "Open rubrics"}>
        <RubricCatalog codes={visible} />
      </Card>

      {group ? (
        <>
          <Card title="Your scores (open rubrics)">
            {visible.length === 0 ? (
              <p className="m-0 text-muted">No rubric window is open yet.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {visible.map((code) => {
                  const mark = myMarks.find((m) => m.rubricCode === code);
                  const schedule = scheduleMap.get(code);
                  const active = isRubricInActiveWindow(schedule);
                  return (
                    <div key={code} className="rounded-xl border border-line bg-white px-3 py-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <strong>
                          {code} · {RUBRICS[code].title}
                        </strong>
                        {active ? <Badge tone="ok">Active</Badge> : <Badge>Unlocked</Badge>}
                      </div>
                      <div className="mt-1 text-brand-deep font-semibold">
                        {mark ? mark.marks : "—"} / {RUBRICS[code].maxMarks}
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {schedule
                          ? `${new Date(schedule.openAt).toLocaleDateString()} → ${new Date(schedule.dueAt).toLocaleDateString()}`
                          : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card title={`Group review — ${group.projectTitle}`}>
            <RubricPanel
              groupId={group.id}
              students={group.students}
              statuses={group.rubricStatuses}
              marks={group.rubricMarks}
              canEvaluate={false}
              canUpload={group.status === "active"}
              codes={visible}
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
