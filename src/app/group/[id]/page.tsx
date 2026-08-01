import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { adminNav, facultyNav, studentNav } from "@/lib/nav";
import { RUBRIC_CODES, WEEK_COUNT } from "@/lib/map/rubrics";
import { MemberInviteSearch } from "@/components/member-invite-search";
import { GroupSummaryButton } from "@/components/group-summary";
import {
  CancelInviteButton,
  ProjectTitleForm,
  SubmitGroupButton,
  WeeklyEvalForm,
  WeeklySummaryForm,
} from "@/components/group-forms";
import { ToastFromQuery } from "@/components/alerts";
import { StudentName } from "@/components/student-name-link";
import {
  Badge,
  Card,
  PageHead,
  Shell,
  statusTone,
} from "@/components/ui";

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ summary?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { id } = await params;
  const sp = await searchParams;
  const groupId = Number(id);
  if (!groupId) notFound();

  const group = await prisma.projectGroup.findUnique({
    where: { id: groupId },
    include: {
      batch: true,
      students: { orderBy: [{ isLeader: "desc" }, { fullName: "asc" }] },
      mentors: { include: { faculty: true } },
      weeklyEntries: { orderBy: { weekNumber: "asc" } },
      rubricStatuses: true,
      rubricMarks: true,
      invites: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!group) notFound();

  const role = session.user.role;
  const userId = Number(session.user.id);
  let isLeader = false;

  if (role === "student") {
    const me = await prisma.student.findUnique({ where: { id: userId } });
    if (me?.groupId !== groupId) redirect("/student");
    isLeader = Boolean(me?.isLeader);
  }
  if (role === "faculty") {
    const mentorship = await prisma.groupMentor.findFirst({
      where: { groupId, facultyId: userId },
    });
    if (!mentorship) redirect("/faculty");
  }

  const nav =
    role === "admin" ? adminNav("groups") : role === "faculty" ? facultyNav("home") : studentNav("home");

  const mentor = group.mentors[0]?.faculty;
  const weekMap = new Map(group.weeklyEntries.map((w) => [w.weekNumber, w]));
  const canEditTitle =
    role === "admin" ||
    (role === "faculty" && group.status === "active") ||
    (role === "student" && isLeader && group.status === "forming");
  const canManageMembers = role === "student" && isLeader && group.status === "forming";
  const canWriteWeek = role === "student" && group.status === "active";
  const canEvaluate = (role === "faculty" || role === "admin") && group.status === "active";
  const canEditSummary =
    role === "admin" ||
    role === "faculty" ||
    (role === "student" && isLeader);
  const linkStudentProfiles = role === "admin" || role === "faculty";
  const pendingInvites = group.invites.filter((i) => i.status === "pending");
  const weeksLogged = group.weeklyEntries.filter((w) => w.summary.trim()).length;
  const rubricsHref =
    role === "admin"
      ? `/admin/rubrics?group=${group.id}`
      : role === "faculty"
        ? `/faculty/rubrics?group=${group.id}`
        : "/student/rubrics";
  const completedRubrics = group.rubricStatuses.filter((r) => r.status === "completed").length;

  const totals = group.students.map((s) => {
    const marks = group.rubricMarks.filter((m) => m.studentId === s.id);
    const total = marks.reduce((sum, m) => sum + m.marks, 0);
    return { student: s, total, byRubric: Object.fromEntries(marks.map((m) => [m.rubricCode, m.marks])) };
  });

  return (
    <Shell nav={nav} user={session.user}>
      <ToastFromQuery />
      <PageHead
        title={group.projectTitle}
        subtitle={`${group.groupCode} · Batch ${group.batch.label}${mentor ? ` · Mentor: ${mentor.fullName}` : " · Mentor not assigned"}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(group.status)}>{group.status.replaceAll("_", " ")}</Badge>
            <GroupSummaryButton
              initiallyOpen={sp.summary === "1" || sp.summary === "open"}
              canEdit={canEditSummary}
              data={{
                groupId: group.id,
                groupCode: group.groupCode,
                projectTitle: group.projectTitle,
                projectAbout: group.projectAbout,
                domain: group.domain,
                objectives: group.objectives,
                techStack: group.techStack,
                status: group.status,
                batchLabel: group.batch.label,
                mentorName: mentor?.fullName ?? null,
                members: group.students.map((s) => ({
                  id: s.id,
                  fullName: s.fullName,
                  uniqueId: s.uniqueId,
                  isLeader: s.isLeader,
                })),
                weeksLogged,
                rubricsCompleted: completedRubrics,
                totalRubrics: RUBRIC_CODES.length,
                linkProfiles: linkStudentProfiles,
              }}
            />
          </div>
        }
      />

      {group.status === "forming" ? (
        <Card title="Team formation">
          <p className="mt-0 text-sm text-muted">
            Invite members with the search box. Each student must approve from their portal. When all
            invites are settled (or you submit), the group goes to admin for approval.
          </p>
          {canManageMembers ? (
            <div className="grid gap-4">
              <MemberInviteSearch groupId={group.id} />
              {pendingInvites.length > 0 ? (
                <div>
                  <h3 className="mt-0 text-sm font-semibold">Pending approvals</h3>
                  <ul className="m-0 list-none space-y-2 p-0">
                    {pendingInvites.map((inv) => (
                      <li
                        key={inv.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm"
                      >
                        <span>
                          {inv.aktuRoll} <Badge tone="warn">awaiting approval</Badge>
                        </span>
                        <CancelInviteButton inviteId={inv.id} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {pendingInvites.length === 0 ? (
                <SubmitGroupButton groupId={group.id} />
              ) : (
                <p className="mb-0 text-sm text-warn">
                  Waiting for {pendingInvites.length} member approval
                  {pendingInvites.length > 1 ? "s" : ""}.
                </p>
              )}
            </div>
          ) : (
            <p className="mb-0 text-sm text-ink-soft">
              Waiting for leader to finish invites / submit for admin approval.
            </p>
          )}
        </Card>
      ) : null}

      {group.status === "pending_admin" ? (
        <Card title="Awaiting admin approval">
          <p className="m-0 text-sm text-muted">
            All member invites are settled. An admin must approve this group before weekly diary and
            rubrics unlock.
          </p>
        </Card>
      ) : null}

      <Card title="Project & members">
        {canEditTitle ? (
          <ProjectTitleForm groupId={group.id} projectTitle={group.projectTitle} />
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-3 font-semibold">Name</th>
                <th className="py-2 pr-3 font-semibold">AKTU Roll</th>
                <th className="py-2 pr-3 font-semibold">Role</th>
                <th className="py-2 pr-3 font-semibold">Contact</th>
                <th className="py-2 font-semibold">Total marks</th>
              </tr>
            </thead>
            <tbody>
              {totals.map(({ student, total }) => (
                <tr key={student.id} className="border-b border-line/70">
                  <td className="py-3 pr-3 font-medium">
                    <StudentName
                      studentId={student.id}
                      name={student.fullName}
                      link={linkStudentProfiles}
                      className={
                        linkStudentProfiles
                          ? "font-semibold text-brand no-underline hover:underline"
                          : undefined
                      }
                    />
                  </td>
                  <td className="py-3 pr-3">{student.uniqueId}</td>
                  <td className="py-3 pr-3">
                    <Badge tone={student.isLeader ? "info" : "muted"}>
                      {student.isLeader ? "Leader" : "Member"}
                    </Badge>
                  </td>
                  <td className="py-3 pr-3 text-muted">
                    {student.phone || student.email || "—"}
                  </td>
                  <td className="py-3 font-semibold text-brand-deep">{total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Weekly analysis (Week 1–8)">
        <div className="grid gap-4">
          {Array.from({ length: WEEK_COUNT }, (_, i) => i + 1).map((week) => {
            const entry = weekMap.get(week);
            return (
              <div key={week} className="rounded-2xl border border-line bg-white/70 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="m-0 text-lg font-semibold">Week {week}</h3>
                  {entry?.performance ? (
                    <Badge tone={entry.performance === "satisfactory" ? "ok" : "danger"}>
                      {entry.performance}
                    </Badge>
                  ) : (
                    <Badge>Not evaluated</Badge>
                  )}
                </div>

                {canWriteWeek ? (
                  <WeeklySummaryForm
                    groupId={group.id}
                    weekNumber={week}
                    summary={entry?.summary ?? ""}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-ink-soft">
                    {entry?.summary?.trim() ? entry.summary : "No summary submitted yet."}
                  </p>
                )}

                {canEvaluate ? (
                  <WeeklyEvalForm
                    groupId={group.id}
                    weekNumber={week}
                    performance={entry?.performance ?? ""}
                  />
                ) : null}

                <div className="mt-2 text-xs text-muted">
                  Submitted:{" "}
                  {entry?.submissionDate ? new Date(entry.submissionDate).toLocaleDateString() : "—"}
                  {" · "}
                  Evaluated:{" "}
                  {entry?.evaluationDate ? new Date(entry.evaluationDate).toLocaleDateString() : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Rubrics (R1–R8)">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 text-sm text-ink-soft">
              Rubric catalog and scoring live in the dedicated <strong>Rubrics</strong> section.
            </p>
            <p className="mt-2 mb-0">
              <Badge tone={completedRubrics === RUBRIC_CODES.length ? "ok" : "warn"}>
                {completedRubrics}/{RUBRIC_CODES.length} completed
              </Badge>
            </p>
          </div>
          <Link
            href={rubricsHref}
            className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white no-underline"
          >
            {canEvaluate ? "Open Rubrics scoring →" : "View Rubrics →"}
          </Link>
        </div>
      </Card>
    </Shell>
  );
}
