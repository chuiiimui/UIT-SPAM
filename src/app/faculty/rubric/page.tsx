import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultRubric, saveRubricScores } from "@/lib/features/actions";
import { facultyNav } from "@/lib/nav";
import { btnPrimary, Card, Field, inputClass, PageHead, Shell } from "@/components/ui";

export default async function FacultyRubricPage({
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
  const rubric = await ensureDefaultRubric();
  const criteria = await prisma.rubricCriterion.findMany({
    where: { rubricId: rubric.id },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <Shell nav={facultyNav("rubric")} user={session!.user}>
      <PageHead title="Rubric marking" subtitle="Score fixed criteria with automatic totals for panels." />
      <Card title={rubric.name}>
        {!mentorships.length ? (
          <p className="text-muted">No groups assigned.</p>
        ) : (
          <form action={saveRubricScores}>
            <input type="hidden" name="rubricId" value={rubric.id} />
            <Field label="Group">
              <select className={inputClass} name="groupId" defaultValue={selected}>
                {mentorships.map((m) => (
                  <option key={m.groupId} value={m.groupId}>
                    {m.group.groupCode} — {m.group.groupName}
                  </option>
                ))}
              </select>
            </Field>
            {criteria.map((c) => (
              <div key={c.id} className="mb-4 grid gap-3 sm:grid-cols-[1fr_120px]">
                <div>
                  <strong>{c.label}</strong>
                  <div className="text-sm text-muted">Max {c.maxMarks} · weight {c.weight}</div>
                  <input className={`${inputClass} mt-2`} name={`note_${c.id}`} placeholder="Optional note" />
                </div>
                <Field label="Marks">
                  <input
                    className={inputClass}
                    type="number"
                    step="0.5"
                    name={`criterion_${c.id}`}
                    defaultValue={Math.round(c.maxMarks * 0.8)}
                    max={c.maxMarks}
                  />
                </Field>
              </div>
            ))}
            <button className={btnPrimary} type="submit">
              Save rubric scores
            </button>
          </form>
        )}
      </Card>
    </Shell>
  );
}
