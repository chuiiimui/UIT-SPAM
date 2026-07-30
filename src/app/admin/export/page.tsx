import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { adminNav } from "@/lib/nav";
import { Card, PageHead, Shell } from "@/components/ui";

export default async function AdminExportPage() {
  const session = await auth();
  const groups = await prisma.projectGroup.findMany({
    include: {
      students: true,
      assessments: true,
      vivaScores: true,
      mentors: { where: { isPrimary: true }, include: { faculty: true } },
      project: true,
    },
    orderBy: { groupCode: "asc" },
  });

  const lines = [
    "groupCode,groupName,department,mentor,projectTitle,members,avgAssessmentPct,vivaAvg",
    ...groups.map((g) => {
      const avg =
        g.assessments.length > 0
          ? (
              g.assessments.reduce((s, a) => s + (a.marks / a.maxMarks) * 100, 0) /
              g.assessments.length
            ).toFixed(1)
          : "";
      const viva =
        g.vivaScores.length > 0
          ? (
              g.vivaScores.reduce((s, a) => s + (a.marks / a.maxMarks) * 100, 0) / g.vivaScores.length
            ).toFixed(1)
          : "";
      return [
        g.groupCode,
        g.groupName || "",
        g.department || "",
        g.mentors[0]?.faculty.fullName || "",
        g.project?.title || "",
        g.students.length,
        avg,
        viva,
      ]
        .map((x) => `"${String(x).replaceAll('"', '""')}"`)
        .join(",");
    }),
  ].join("\n");

  return (
    <Shell nav={adminNav("export")} user={session!.user}>
      <PageHead title="Exam-cell export" subtitle="Copy or download marksheet CSV for result processing." />
      <Card title="Marksheet CSV">
        <a
          className="inline-flex rounded-xl bg-[#334d93] px-4 py-3 text-sm font-semibold text-white"
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(lines)}`}
          download="uit-spam-marksheet.csv"
        >
          Download CSV
        </a>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-brand-mist p-4 text-xs">{lines}</pre>
      </Card>
    </Shell>
  );
}
