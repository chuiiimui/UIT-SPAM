import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/map/session";
import { facultyNav } from "@/lib/nav";
import {
  nextLockedRubric,
  visibleRubricCodes,
} from "@/lib/map/rubrics";
import { RubricCatalog, RubricPanel } from "@/components/rubric-panel";
import { Badge, Card, PageHead, Shell } from "@/components/ui";

export default async function FacultyRubricsPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const session = await requireRole("faculty");
  const sp = await searchParams;
  const facultyId = Number(session.user.id);

  const mentorships = await prisma.groupMentor.findMany({
    where: { facultyId },
    include: {
      group: {
        include: {
          batch: { include: { rubricDeadlines: true } },
          students: { orderBy: [{ isLeader: "desc" }, { fullName: "asc" }] },
          rubricStatuses: true,
          rubricMarks: true,
        },
      },
    },
    orderBy: { assignedAt: "asc" },
  });

  const groups = mentorships.map((m) => m.group);
  const selectedId = sp.group ? Number(sp.group) : groups[0]?.id;
  const selected = groups.find((g) => g.id === selectedId) ?? null;

  const deadlines = selected?.batch.rubricDeadlines ?? [];
  const visible = selected ? visibleRubricCodes(deadlines) : [];
  const next = selected ? nextLockedRubric(deadlines) : null;

  return (
    <Shell nav={facultyNav("rubrics")} user={session.user}>
      <PageHead
        title="Rubrics"
        subtitle="Score only rubrics that are open on the admin timeline. Future windows stay hidden."
      />

      {selected && next ? (
        <Card>
          <p className="m-0 text-sm text-ink-soft">
            Next unlock for this batch: <strong>{next.rubricCode}</strong> on{" "}
            <strong>{new Date(next.openAt).toLocaleString()}</strong>
            {visible.length ? (
              <>
                {" "}
                · Open now: <strong>{visible.join(", ")}</strong>
              </>
            ) : null}
          </p>
        </Card>
      ) : null}

      <Card title={visible.length ? `Open catalog (${visible.join(", ")})` : "Open catalog"}>
        <RubricCatalog codes={selected ? visible : []} />
      </Card>

      {groups.length === 0 ? (
        <Card>
          <p className="m-0 text-muted">No mentored groups yet. Ask admin to assign you.</p>
        </Card>
      ) : (
        <>
          <Card title="Select group">
            <div className="flex flex-wrap gap-2">
              {groups.map((g) => {
                const openCodes = visibleRubricCodes(g.batch.rubricDeadlines);
                const done = g.rubricStatuses.filter(
                  (r) => r.status === "completed" && openCodes.includes(r.rubricCode as never),
                ).length;
                const active = g.id === selected?.id;
                return (
                  <Link
                    key={g.id}
                    href={`/faculty/rubrics?group=${g.id}`}
                    className={`rounded-xl border px-3 py-2 text-sm no-underline ${
                      active
                        ? "border-brand bg-brand-soft text-brand-deep"
                        : "border-line bg-white text-ink"
                    }`}
                  >
                    <strong>{g.groupCode}</strong>
                    <span className="ml-2 text-muted">{g.projectTitle}</span>
                    <span className="ml-2">
                      <Badge tone={openCodes.length > 0 && done === openCodes.length ? "ok" : "warn"}>
                        {done}/{openCodes.length || 0} open
                      </Badge>
                    </span>
                  </Link>
                );
              })}
            </div>
          </Card>

          {selected ? (
            <Card title={`Scoring — ${selected.projectTitle}`}>
              <p className="mt-0 text-sm text-muted">
                {selected.groupCode} · {selected.batch.label} ·{" "}
                <Link href={`/group/${selected.id}`} className="font-semibold text-brand no-underline">
                  Open full group page
                </Link>
                {" · "}
                <Link
                  href={`/group/${selected.id}?summary=1`}
                  className="font-semibold text-brand no-underline"
                >
                  Project summary
                </Link>
              </p>
              <RubricPanel
                groupId={selected.id}
                students={selected.students}
                statuses={selected.rubricStatuses}
                marks={selected.rubricMarks}
                canEvaluate
                linkProfiles
                codes={visible}
              />
            </Card>
          ) : null}
        </>
      )}
    </Shell>
  );
}
