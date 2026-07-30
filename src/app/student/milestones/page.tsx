import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MILESTONES } from "@/lib/constants";
import { markMilestoneDone } from "@/lib/features/actions";
import { studentNav } from "@/lib/nav";
import { Badge, btnPrimary, Card, PageHead, Shell, statusTone } from "@/components/ui";
import { format } from "date-fns";

export default async function StudentMilestonesPage() {
  const session = await auth();
  const student = await prisma.student.findUnique({ where: { id: Number(session!.user.id) } });
  const states = student?.groupId
    ? await prisma.groupMilestone.findMany({ where: { groupId: student.groupId } })
    : [];
  const deadlines = await prisma.milestoneDeadline.findMany({ orderBy: { dueAt: "asc" } });
  const stateMap = Object.fromEntries(states.map((s) => [s.milestone, s]));

  return (
    <Shell nav={studentNav("milestones")} user={session!.user}>
      <PageHead title="Milestone checklist" subtitle="Track campus deadlines and mark your group progress." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Your checklist">
          <div className="grid gap-3">
            {Object.entries(MILESTONES).map(([key, label]) => {
              const st = stateMap[key];
              return (
                <div key={key} className="flex items-center justify-between gap-3 border-b border-line pb-3">
                  <div>
                    <strong>{label}</strong>
                    <div className="mt-1">
                      <Badge tone={st?.status === "done" ? "ok" : "warn"}>
                        {st?.status || "pending"}
                      </Badge>
                    </div>
                  </div>
                  {st?.status !== "done" ? (
                    <form action={markMilestoneDone}>
                      <input type="hidden" name="milestone" value={key} />
                      <button className={btnPrimary + " !py-2 !px-3 text-xs"} type="submit">
                        Mark done
                      </button>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
        <Card title="Campus deadlines">
          {!deadlines.length ? (
            <p className="text-muted">No deadlines published yet.</p>
          ) : (
            deadlines.map((d) => (
              <div key={d.id} className="border-b border-line py-3 last:border-0">
                <strong>{d.title}</strong>
                <div className="text-muted">
                  {MILESTONES[d.milestone] || d.milestone} · due {format(d.dueAt, "dd MMM yyyy")}
                </div>
                <p className="mb-0 mt-1 text-sm">{d.description}</p>
              </div>
            ))
          )}
        </Card>
      </div>
    </Shell>
  );
}
