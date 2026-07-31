import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/map/session";
import { adminNav } from "@/lib/nav";
import { RUBRIC_CODES } from "@/lib/map/rubrics";
import { RubricCatalog, RubricPanel } from "@/components/rubric-panel";
import { Badge, Card, PageHead, Shell, inputClass } from "@/components/ui";

export default async function AdminRubricsPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; batch?: string }>;
}) {
  const session = await requireRole("admin");
  const sp = await searchParams;
  const batches = await prisma.batch.findMany({ orderBy: { endYear: "desc" } });
  const batchYear = sp.batch ? Number(sp.batch) : undefined;

  const groups = await prisma.projectGroup.findMany({
    where: batchYear ? { batch: { endYear: batchYear } } : undefined,
    include: {
      batch: true,
      students: { orderBy: [{ isLeader: "desc" }, { fullName: "asc" }] },
      rubricStatuses: true,
      rubricMarks: true,
      mentors: { include: { faculty: true } },
    },
    orderBy: { id: "asc" },
  });

  const selectedId = sp.group ? Number(sp.group) : groups[0]?.id;
  const selected = groups.find((g) => g.id === selectedId) ?? null;

  return (
    <Shell nav={adminNav("rubrics")} user={session.user}>
      <PageHead
        title="Rubrics"
        subtitle="Campus R1–R8 catalog, group status, and scoring."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/dates"
              className="rounded-xl bg-[#16a34a] px-4 py-3 text-sm font-semibold text-white no-underline"
            >
              Manage dates
            </Link>
            <Link
              href="/admin/marks"
              className="rounded-xl bg-[#0d9488] px-4 py-3 text-sm font-semibold text-white no-underline"
            >
              Marks sheet
            </Link>
          </div>
        }
      />

      <Card title="Rubric catalog (R1–R8)">
        <RubricCatalog />
      </Card>

      <Card title="Groups — rubric progress">
        <form className="mb-4 flex flex-wrap gap-2">
          <select className={`${inputClass} max-w-xs`} name="batch" defaultValue={sp.batch ?? ""}>
            <option value="">All batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.endYear}>
                {b.label}
              </option>
            ))}
          </select>
          <button className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white" type="submit">
            Filter
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-3">Group</th>
                <th className="py-2 pr-3">Project</th>
                <th className="py-2 pr-3">Mentor</th>
                <th className="py-2 pr-3">Completed</th>
                <th className="py-2">Open</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const done = g.rubricStatuses.filter((r) => r.status === "completed").length;
                return (
                  <tr key={g.id} className="border-b border-line/70">
                    <td className="py-2 pr-3 font-medium">{g.groupCode}</td>
                    <td className="py-2 pr-3">{g.projectTitle}</td>
                    <td className="py-2 pr-3">{g.mentors[0]?.faculty.fullName ?? "—"}</td>
                    <td className="py-2 pr-3">
                      <Badge tone={done === RUBRIC_CODES.length ? "ok" : "warn"}>
                        {done}/{RUBRIC_CODES.length}
                      </Badge>
                    </td>
                    <td className="py-2">
                      <Link
                        href={`/admin/rubrics?group=${g.id}${batchYear ? `&batch=${batchYear}` : ""}`}
                        className="font-semibold text-brand no-underline"
                      >
                        Score →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {selected ? (
        <Card title={`Scoring — ${selected.projectTitle}`}>
          <p className="mt-0 text-sm text-muted">
            {selected.groupCode} · {selected.batch.label} ·{" "}
            <Link href={`/group/${selected.id}`} className="font-semibold text-brand no-underline">
              Open group page
            </Link>
            {" · "}
            <Link
              href={`/group/${selected.id}?summary=1`}
              className="font-semibold text-brand no-underline"
            >
              Project summary
            </Link>
          </p>
          <RubricPanel
            groupId={selected.id}
            students={selected.students}
            statuses={selected.rubricStatuses}
            marks={selected.rubricMarks}
            canEvaluate
          />
        </Card>
      ) : null}
    </Shell>
  );
}
