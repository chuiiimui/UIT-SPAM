import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/map/session";
import { adminNav } from "@/lib/nav";
import { RubricTimelineForm } from "@/components/rubric-timeline-form";
import { Card, PageHead, Shell, inputClass } from "@/components/ui";

function toDatetimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function AdminDatesPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>;
}) {
  const session = await requireRole("admin");
  const sp = await searchParams;
  const batches = await prisma.batch.findMany({ orderBy: { endYear: "desc" } });
  const batchId = sp.batch ? Number(sp.batch) : batches[0]?.id;
  const batch = batches.find((b) => b.id === batchId) ?? batches[0];

  const deadlines = batch
    ? await prisma.rubricDeadline.findMany({ where: { batchId: batch.id } })
    : [];

  const schedules = deadlines.map((d) => ({
    rubricCode: d.rubricCode,
    openAt: toDatetimeLocal(d.openAt),
    dueAt: toDatetimeLocal(d.dueAt),
  }));

  return (
    <Shell nav={adminNav("dates")} user={session.user}>
      <PageHead
        title="Rubric timeline"
        subtitle="Set open and due date/time for R1–R8. Students and mentors only see rubrics after their open time."
      />

      <Card>
        <form className="mb-5 flex flex-wrap gap-2">
          <select className={`${inputClass} max-w-xs`} name="batch" defaultValue={batch?.id}>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
          <button className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white" type="submit">
            Select batch
          </button>
        </form>

        <p className="mt-0 mb-4 text-sm text-muted">
          Tip: make each next rubric&apos;s <strong>Open</strong> time after the previous{" "}
          <strong>Due</strong> so only one new rubric appears at a time. Past unlocked rubrics stay
          visible so scores and uploads remain available.
        </p>

        {batch ? (
          <RubricTimelineForm batchId={batch.id} schedules={schedules} />
        ) : (
          <p className="text-muted">No batches found.</p>
        )}
      </Card>
    </Shell>
  );
}
