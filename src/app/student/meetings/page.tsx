import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { studentNav } from "@/lib/nav";
import { Badge, Card, PageHead, Shell } from "@/components/ui";
import { format } from "date-fns";

export default async function StudentMeetingsPage() {
  const session = await auth();
  const student = await prisma.student.findUnique({ where: { id: Number(session!.user.id) } });
  const meetings = student?.groupId
    ? await prisma.meeting.findMany({
        where: { groupId: student.groupId },
        include: {
          faculty: true,
          attendance: { where: { studentId: student.id } },
        },
        orderBy: { scheduledAt: "desc" },
      })
    : [];

  return (
    <Shell nav={studentNav("meetings")} user={session!.user}>
      <PageHead title="Mentor meetings" subtitle="Schedules, notes, and your attendance." />
      <Card>
        {!meetings.length ? (
          <p className="text-muted">No meetings scheduled yet.</p>
        ) : (
          meetings.map((m) => (
            <div key={m.id} className="border-b border-line py-4 last:border-0">
              <div className="flex flex-wrap items-center gap-2">
                <strong>{m.title}</strong>
                <Badge tone={m.attendance[0]?.present ? "ok" : "warn"}>
                  {m.attendance[0]?.present ? "Present" : "Absent / not marked"}
                </Badge>
              </div>
              <div className="text-muted">
                {format(m.scheduledAt, "dd MMM yyyy HH:mm")} · {m.faculty.fullName}
                {m.location ? ` · ${m.location}` : ""}
              </div>
              {m.notes ? <p className="mt-2 mb-0 text-sm">{m.notes}</p> : null}
              {m.actionItems ? (
                <p className="mt-1 mb-0 text-sm text-brand">Actions: {m.actionItems}</p>
              ) : null}
            </div>
          ))
        )}
      </Card>
    </Shell>
  );
}
