import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveVivaScore } from "@/lib/features/actions";
import { facultyNav } from "@/lib/nav";
import { btnPrimary, Card, Field, inputClass, PageHead, Shell } from "@/components/ui";
import { format } from "date-fns";

export default async function FacultyVivaPage() {
  const session = await auth();
  const facultyId = Number(session!.user.id);
  const mentorships = await prisma.groupMentor.findMany({
    where: { facultyId },
    include: { group: true },
  });
  const history = await prisma.vivaScore.findMany({
    where: { facultyId },
    include: { group: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <Shell nav={facultyNav("viva")} user={session!.user}>
      <PageHead title="Viva / mid-term scoring" subtitle="Separate panels for mid-sem and final viva." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Record viva">
          <form action={saveVivaScore}>
            <Field label="Group">
              <select className={inputClass} name="groupId">
                {mentorships.map((m) => (
                  <option key={m.groupId} value={m.groupId}>
                    {m.group.groupCode}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Round">
              <select className={inputClass} name="round">
                <option value="midterm">Mid-term</option>
                <option value="final">Final viva</option>
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Marks">
                <input className={inputClass} type="number" name="marks" defaultValue={35} />
              </Field>
              <Field label="Max">
                <input className={inputClass} type="number" name="maxMarks" defaultValue={50} />
              </Field>
            </div>
            <Field label="Notes">
              <textarea className={inputClass} name="notes" rows={3} />
            </Field>
            <button className={btnPrimary} type="submit">
              Save viva score
            </button>
          </form>
        </Card>
        <Card title="Recent viva scores">
          {history.map((h) => (
            <div key={h.id} className="border-b border-line py-3 last:border-0">
              <strong>
                {h.group.groupCode} · {h.round}
              </strong>{" "}
              {h.marks}/{h.maxMarks}
              <div className="text-muted">{format(h.createdAt, "dd MMM yyyy")}</div>
              <p className="mb-0 text-sm">{h.notes}</p>
            </div>
          ))}
        </Card>
      </div>
    </Shell>
  );
}
