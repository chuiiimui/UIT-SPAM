import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createDeadline } from "@/lib/features/actions";
import { MILESTONES } from "@/lib/constants";
import { adminNav } from "@/lib/nav";
import { btnPrimary, Card, Field, inputClass, PageHead, Shell } from "@/components/ui";
import { format } from "date-fns";

export default async function AdminCalendarPage() {
  const session = await auth();
  const deadlines = await prisma.milestoneDeadline.findMany({ orderBy: { dueAt: "asc" } });

  return (
    <Shell nav={adminNav("calendar")} user={session!.user}>
      <PageHead title="Deadline calendar" subtitle="Campus-wide milestone dates pushed to all groups." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Publish deadline">
          <form action={createDeadline}>
            <Field label="Milestone">
              <select className={inputClass} name="milestone">
                {Object.entries(MILESTONES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input className={inputClass} name="title" required placeholder="Proposal submission deadline" />
            </Field>
            <Field label="Due date">
              <input className={inputClass} type="datetime-local" name="dueAt" required />
            </Field>
            <Field label="Department (blank = all)">
              <input className={inputClass} name="department" />
            </Field>
            <Field label="Description">
              <textarea className={inputClass} name="description" rows={3} />
            </Field>
            <button className={btnPrimary} type="submit">
              Publish
            </button>
          </form>
        </Card>
        <Card title="Upcoming">
          {deadlines.map((d) => (
            <div key={d.id} className="border-b border-line py-3 last:border-0">
              <strong>{d.title}</strong>
              <div className="text-muted">
                {format(d.dueAt, "dd MMM yyyy HH:mm")} · {MILESTONES[d.milestone] || d.milestone}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </Shell>
  );
}
