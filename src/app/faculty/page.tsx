import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/map/session";
import { facultyNav } from "@/lib/nav";
import { StudentNameLink } from "@/components/student-name-link";
import { Badge, Card, PageHead, Shell } from "@/components/ui";

export default async function FacultyHomePage() {
  const session = await requireRole("faculty");
  const mentorships = await prisma.groupMentor.findMany({
    where: {
      facultyId: Number(session.user.id),
      group: { status: "active" },
    },
    include: {
      group: {
        include: {
          batch: true,
          students: { orderBy: { isLeader: "desc" } },
          weeklyEntries: true,
        },
      },
    },
    orderBy: { assignedAt: "asc" },
  });

  return (
    <Shell nav={facultyNav("home")} user={session.user}>
      <PageHead
        title="My groups"
        subtitle="Open a group to review weekly diary and R1–R8 marks on one page."
      />

      {mentorships.length === 0 ? (
        <Card>
          <p className="m-0 text-muted">No groups assigned yet. Ask admin to assign you as mentor.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {mentorships.map(({ group }) => {
            const filledWeeks = group.weeklyEntries.filter((w) => w.summary.trim()).length;
            const leader = group.students.find((s) => s.isLeader) ?? group.students[0];
            return (
              <div
                key={group.id}
                className="rounded-[18px] border border-line bg-white/80 p-5 shadow-[var(--shadow)] transition hover:border-[rgba(51,77,147,0.35)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {group.groupCode} · {group.batch.label}
                    </div>
                    <h2 className="m-0 mt-1 font-[family-name:var(--font-display)] text-xl">
                      {group.projectTitle}
                    </h2>
                    <p className="mt-1 mb-0 text-sm text-ink-soft">
                      Leader:{" "}
                      {leader ? (
                        <StudentNameLink studentId={leader.id} name={leader.fullName} />
                      ) : (
                        "—"
                      )}{" "}
                      · {group.students.length} members
                    </p>
                    {group.students.length > 0 ? (
                      <p className="mt-1 mb-0 text-xs text-muted">
                        Members:{" "}
                        {group.students.map((s, i) => (
                          <span key={s.id}>
                            {i > 0 ? ", " : ""}
                            <StudentNameLink
                              studentId={s.id}
                              name={s.fullName}
                              className="font-medium text-brand no-underline hover:underline"
                            />
                          </span>
                        ))}
                      </p>
                    ) : null}
                  </div>
                  <Badge tone="info">{filledWeeks}/8 weeks logged</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/group/${group.id}`}
                    className="rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-white no-underline"
                  >
                    Open group
                  </Link>
                  <Link
                    href={`/group/${group.id}?summary=1`}
                    className="rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-semibold text-brand-deep no-underline"
                  >
                    Project summary
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
