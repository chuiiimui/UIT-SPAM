import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { facultyAssess } from "@/lib/actions/app";
import { MILESTONES } from "@/lib/constants";
import { btnPrimary, Card, Field, inputClass, PageHead, Shell } from "@/components/ui";
import { facultyNav } from "@/lib/nav";
import { format } from "date-fns";

export default async function FacultyAssessPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const facultyId = Number(session!.user.id);
  const mentorships = await prisma.groupMentor.findMany({
    where: { facultyId },
    include: { group: true },
    orderBy: { group: { groupCode: "asc" } },
  });
  const selected = Number(sp.groupId || mentorships[0]?.groupId || 0);
  const members = selected
    ? await prisma.student.findMany({
        where: { groupId: selected },
        orderBy: [{ isLeader: "desc" }, { fullName: "asc" }],
      })
    : [];
  const history = selected
    ? await prisma.assessment.findMany({
        where: { groupId: selected, facultyId },
        include: { student: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];

  return (
    <Shell nav={facultyNav("assess")} user={session!.user}>
      <PageHead title="Progress marks" subtitle="Score the whole group or individual contribution per milestone." />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card title="Record assessment">
          {!mentorships.length ? (
            <p className="text-muted">No groups to assess.</p>
          ) : (
            <form action={facultyAssess}>
              <Field label="Group">
                <select className={inputClass} name="groupId" defaultValue={selected}>
                  {mentorships.map((m) => (
                    <option key={m.groupId} value={m.groupId}>
                      {m.group.groupCode} — {m.group.groupName || "Group"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Target">
                <select className={inputClass} name="studentId" defaultValue="">
                  <option value="">Whole group</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.studentId})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Milestone">
                <select className={inputClass} name="milestone">
                  {Object.entries(MILESTONES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Marks">
                  <input className={inputClass} type="number" step="0.5" name="marks" defaultValue={8} required />
                </Field>
                <Field label="Max marks">
                  <input className={inputClass} type="number" step="0.5" name="maxMarks" defaultValue={10} required />
                </Field>
              </div>
              <Field label="Contribution note">
                <textarea className={inputClass} name="contributionNote" rows={3} />
              </Field>
              <button className={btnPrimary} type="submit">
                Save marks
              </button>
            </form>
          )}
        </Card>
        <Card title="Recent assessments">
          {!history.length ? (
            <p className="text-muted">Nothing recorded for this group yet.</p>
          ) : (
            history.map((h) => (
              <div key={h.id} className="border-b border-line py-3 last:border-0">
                <strong>
                  {h.marks}/{h.maxMarks}
                </strong>{" "}
                · {h.student?.fullName || "Whole group"}
                <div className="text-muted">
                  {h.milestone ? MILESTONES[h.milestone] || h.milestone : "—"} ·{" "}
                  {format(h.createdAt, "dd MMM yyyy")}
                </div>
                <div>{h.contributionNote}</div>
              </div>
            ))
          )}
        </Card>
      </div>
    </Shell>
  );
}
