import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createMeeting } from "@/lib/features/actions";
import { facultyNav } from "@/lib/nav";
import { btnPrimary, Card, Field, inputClass, PageHead, Shell } from "@/components/ui";
import { format } from "date-fns";

export default async function FacultyMeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const facultyId = Number(session!.user.id);
  const mentorships = await prisma.groupMentor.findMany({
    where: { facultyId },
    include: { group: { include: { students: true } } },
  });
  const selected = Number(sp.groupId || mentorships[0]?.groupId || 0);
  const members = mentorships.find((m) => m.groupId === selected)?.group.students || [];
  const meetings = await prisma.meeting.findMany({
    where: { facultyId },
    include: { group: true, attendance: true },
    orderBy: { scheduledAt: "desc" },
    take: 15,
  });

  return (
    <Shell nav={facultyNav("meetings")} user={session!.user}>
      <PageHead title="Meetings & attendance" subtitle="Schedule mentor sessions and mark who attended." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Schedule meeting">
          <form action={createMeeting}>
            <Field label="Group">
              <select className={inputClass} name="groupId" defaultValue={selected}>
                {mentorships.map((m) => (
                  <option key={m.groupId} value={m.groupId}>
                    {m.group.groupCode}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input className={inputClass} name="title" defaultValue="Weekly mentor review" />
            </Field>
            <Field label="When">
              <input
                className={inputClass}
                type="datetime-local"
                name="scheduledAt"
                defaultValue={new Date().toISOString().slice(0, 16)}
              />
            </Field>
            <Field label="Location / link">
              <input className={inputClass} name="location" placeholder="Lab 3 / Meet link" />
            </Field>
            <Field label="Notes">
              <textarea className={inputClass} name="notes" rows={2} />
            </Field>
            <Field label="Action items">
              <textarea className={inputClass} name="actionItems" rows={2} />
            </Field>
            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold">Attendance</p>
              {members.map((s) => (
                <label key={s.id} className="mb-2 flex items-center gap-2 text-sm">
                  <input type="checkbox" name={`present_${s.id}`} defaultChecked />
                  {s.fullName}
                </label>
              ))}
            </div>
            <button className={btnPrimary} type="submit">
              Save meeting
            </button>
          </form>
        </Card>
        <Card title="Recent meetings">
          {meetings.map((m) => (
            <div key={m.id} className="border-b border-line py-3 last:border-0">
              <strong>
                {m.group.groupCode} · {m.title}
              </strong>
              <div className="text-muted">
                {format(m.scheduledAt, "dd MMM yyyy HH:mm")} · present{" "}
                {m.attendance.filter((a) => a.present).length}/{m.attendance.length}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </Shell>
  );
}
