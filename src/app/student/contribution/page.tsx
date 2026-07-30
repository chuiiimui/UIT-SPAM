import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addContribution } from "@/lib/features/actions";
import { studentNav } from "@/lib/nav";
import { btnPrimary, Card, Field, inputClass, PageHead, Shell } from "@/components/ui";
import { format } from "date-fns";

export default async function ContributionPage() {
  const session = await auth();
  const student = await prisma.student.findUnique({ where: { id: Number(session!.user.id) } });
  const logs = student?.groupId
    ? await prisma.contributionLog.findMany({
        where: { groupId: student.groupId },
        include: { student: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <Shell nav={studentNav("contribution")} user={session!.user}>
      <PageHead title="Contribution log" subtitle="Weekly work, hours, and evidence for mentor review." />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <Card title="Log this week">
          <form action={addContribution}>
            <Field label="Week label">
              <input className={inputClass} name="weekLabel" placeholder="Week 6" />
            </Field>
            <Field label="Title">
              <input className={inputClass} name="title" required placeholder="Implemented auth module" />
            </Field>
            <Field label="Hours">
              <input className={inputClass} type="number" step="0.5" name="hours" defaultValue={4} />
            </Field>
            <Field label="Description">
              <textarea className={inputClass} name="description" rows={3} />
            </Field>
            <Field label="Evidence (links / commits)">
              <input className={inputClass} name="evidence" placeholder="github.com/.../commit/abc" />
            </Field>
            <button className={btnPrimary} type="submit">
              Add log
            </button>
          </form>
        </Card>
        <Card title="Team logs">
          {!logs.length ? (
            <p className="text-muted">No contribution entries yet.</p>
          ) : (
            logs.map((l) => (
              <div key={l.id} className="border-b border-line py-3 last:border-0">
                <strong>{l.title}</strong> · {l.hours}h
                <div className="text-muted">
                  {l.student.fullName} · {l.weekLabel} · {format(l.createdAt, "dd MMM")}
                </div>
                <p className="mb-0 mt-1 text-sm">{l.description}</p>
                {l.evidence ? <p className="mt-1 text-xs text-brand">{l.evidence}</p> : null}
              </div>
            ))
          )}
        </Card>
      </div>
    </Shell>
  );
}
