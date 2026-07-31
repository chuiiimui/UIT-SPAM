import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/map/session";
import { adminNav } from "@/lib/nav";
import { RUBRIC_CODES, RUBRICS } from "@/lib/map/rubrics";
import { saveRubricDeadlines } from "@/lib/map/actions";
import { Card, Field, PageHead, Shell, btnPrimary, inputClass } from "@/components/ui";

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
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
  const dueMap = new Map(deadlines.map((d) => [d.rubricCode, d.dueAt]));

  return (
    <Shell nav={adminNav("dates")} user={session.user}>
      <PageHead title="Project Deadline Dates" subtitle="Set final submission deadlines for Rubrics R1–R8." />

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

        {batch ? (
          <form action={saveRubricDeadlines}>
            <input type="hidden" name="batchId" value={batch.id} />
            <div className="grid gap-3 md:grid-cols-2">
              {RUBRIC_CODES.map((code) => (
                <Field key={code} label={`${code} deadline — ${RUBRICS[code].title}`}>
                  <input
                    className={inputClass}
                    type="date"
                    name={`due_${code}`}
                    defaultValue={dueMap.get(code) ? toDateInput(dueMap.get(code)!) : ""}
                  />
                </Field>
              ))}
            </div>
            <button className={btnPrimary} type="submit">
              Save changes
            </button>
          </form>
        ) : (
          <p className="text-muted">No batches found.</p>
        )}
      </Card>
    </Shell>
  );
}
