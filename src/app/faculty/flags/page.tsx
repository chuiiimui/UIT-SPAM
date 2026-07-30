import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { raiseFlag } from "@/lib/features/actions";
import { facultyNav } from "@/lib/nav";
import { Badge, btnPrimary, Card, Field, inputClass, PageHead, Shell, statusTone } from "@/components/ui";
import { format } from "date-fns";

export default async function FacultyFlagsPage() {
  const session = await auth();
  const facultyId = Number(session!.user.id);
  const mentorships = await prisma.groupMentor.findMany({
    where: { facultyId },
    include: { group: true },
  });
  const flags = await prisma.escalationFlag.findMany({
    where: { facultyId },
    include: { group: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Shell nav={facultyNav("flags")} user={session!.user}>
      <PageHead title="Flag & escalate" subtitle="Report inactive members, conflicts, or risk to admin." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Raise flag">
          <form action={raiseFlag}>
            <Field label="Group">
              <select className={inputClass} name="groupId">
                {mentorships.map((m) => (
                  <option key={m.groupId} value={m.groupId}>
                    {m.group.groupCode}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Severity">
              <select className={inputClass} name="severity">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </Field>
            <Field label="Reason">
              <textarea className={inputClass} name="reason" rows={4} required />
            </Field>
            <button className={btnPrimary} type="submit">
              Escalate to admin
            </button>
          </form>
        </Card>
        <Card title="Your flags">
          {flags.map((f) => (
            <div key={f.id} className="border-b border-line py-3 last:border-0">
              <div className="flex gap-2">
                <strong>{f.group.groupCode}</strong>
                <Badge tone={f.severity === "high" ? "danger" : "warn"}>{f.severity}</Badge>
                <Badge tone={statusTone(f.status)}>{f.status}</Badge>
              </div>
              <p className="mb-0 mt-1 text-sm">{f.reason}</p>
              <small className="text-muted">{format(f.createdAt, "dd MMM yyyy")}</small>
            </div>
          ))}
        </Card>
      </div>
    </Shell>
  );
}
