import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/map/session";
import { adminNav } from "@/lib/nav";
import { RUBRIC_CODES } from "@/lib/map/rubrics";
import { StudentNameLink } from "@/components/student-name-link";
import { Card, PageHead, Shell, inputClass } from "@/components/ui";

export default async function AdminMarksPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>;
}) {
  const session = await requireRole("admin");
  const sp = await searchParams;
  const batches = await prisma.batch.findMany({ orderBy: { endYear: "desc" } });
  const batchYear = sp.batch ? Number(sp.batch) : batches[0]?.endYear;

  const groups = await prisma.projectGroup.findMany({
    where: batchYear ? { batch: { endYear: batchYear } } : undefined,
    include: {
      batch: true,
      mentors: { include: { faculty: true } },
      students: { orderBy: { uniqueId: "asc" } },
      rubricMarks: true,
    },
    orderBy: { id: "asc" },
  });

  const rows = groups.flatMap((g) =>
    g.students.map((s, idx) => {
      const by = Object.fromEntries(
        g.rubricMarks.filter((m) => m.studentId === s.id).map((m) => [m.rubricCode, m.marks]),
      );
      const total = RUBRIC_CODES.reduce((sum, code) => sum + (Number(by[code]) || 0), 0);
      return {
        sr: idx === 0 ? g.id : "",
        groupCode: idx === 0 ? g.groupCode : "",
        studentId: s.id,
        roll: s.uniqueId,
        name: s.fullName,
        mentor: g.mentors[0]?.faculty.fullName ?? "—",
        project: idx === 0 ? g.projectTitle : "",
        by,
        total,
      };
    }),
  );

  const csv = [
    ["Sr", "Group", "Roll Number", "Student Name", "Mentor", "Project", ...RUBRIC_CODES, "Total"].join(","),
    ...rows.map((r) =>
      [
        r.sr,
        r.groupCode,
        r.roll,
        `"${r.name}"`,
        `"${r.mentor}"`,
        `"${r.project}"`,
        ...RUBRIC_CODES.map((c) => r.by[c] ?? 0),
        r.total,
      ].join(","),
    ),
  ].join("\n");

  return (
    <Shell nav={adminNav("marks")} user={session.user}>
      <PageHead
        title="Rubrics Marks"
        subtitle="Per-student R1–R8 totals for the selected batch."
        actions={
          <a
            className="rounded-xl bg-[#16a34a] px-4 py-3 text-sm font-semibold text-white no-underline"
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
            download={`uit-spam-marks-${batchYear || "all"}.csv`}
          >
            Download CSV
          </a>
        }
      />

      <Card>
        <form className="mb-4 flex flex-wrap gap-2">
          <select className={`${inputClass} max-w-xs`} name="batch" defaultValue={batchYear ?? ""}>
            {batches.map((b) => (
              <option key={b.id} value={b.endYear}>
                {b.label}
              </option>
            ))}
          </select>
          <button className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white" type="submit">
            Select batch
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-2">Group</th>
                <th className="py-2 pr-2">Roll</th>
                <th className="py-2 pr-2">Student</th>
                <th className="py-2 pr-2">Mentor</th>
                <th className="py-2 pr-2">Project</th>
                {RUBRIC_CODES.map((c) => (
                  <th key={c} className="py-2 pr-2">
                    {c}
                  </th>
                ))}
                <th className="py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.roll}`} className="border-b border-line/60">
                  <td className="py-2 pr-2">{r.groupCode}</td>
                  <td className="py-2 pr-2">{r.roll}</td>
                  <td className="py-2 pr-2">
                    <StudentNameLink
                      studentId={r.studentId}
                      name={r.name}
                      className="font-semibold text-brand no-underline hover:underline"
                    />
                  </td>
                  <td className="py-2 pr-2">{r.mentor}</td>
                  <td className="py-2 pr-2 max-w-[180px] truncate">{r.project}</td>
                  {RUBRIC_CODES.map((c) => (
                    <td key={c} className="py-2 pr-2">
                      {r.by[c] ?? 0}
                    </td>
                  ))}
                  <td className="py-2 font-semibold">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}
