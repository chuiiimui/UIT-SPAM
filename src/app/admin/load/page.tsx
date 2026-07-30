import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { adminNav } from "@/lib/nav";
import { Card, Kpi, PageHead, Shell } from "@/components/ui";

export default async function AdminLoadPage() {
  const session = await auth();
  const faculty = await prisma.faculty.findMany({
    include: {
      mentorships: {
        include: { group: true },
      },
    },
    orderBy: { fullName: "asc" },
  });

  const loads = faculty
    .map((f) => ({
      ...f,
      load: f.mentorships.length,
    }))
    .sort((a, b) => a.load - b.load);

  const avg = loads.length ? loads.reduce((s, f) => s + f.load, 0) / loads.length : 0;

  return (
    <Shell nav={adminNav("load")} user={session!.user}>
      <PageHead
        title="Mentor load balancer"
        subtitle="See how many groups each faculty mentors and rebalance assignments."
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Kpi label="Faculty" value={loads.length} />
        <Kpi label="Avg groups / mentor" value={avg.toFixed(1)} />
        <Kpi label="Lightest load" value={loads[0] ? `${loads[0].fullName} (${loads[0].load})` : "—"} />
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-3">Faculty</th>
                <th>Dept</th>
                <th>Groups</th>
                <th>Assigned</th>
                <th>Suggestion</th>
              </tr>
            </thead>
            <tbody>
              {loads.map((f) => (
                <tr key={f.id} className="border-t border-line">
                  <td className="py-3">
                    <strong>{f.fullName}</strong>
                    <div className="text-muted">{f.facultyId}</div>
                  </td>
                  <td>{f.department}</td>
                  <td>{f.load}</td>
                  <td className="text-muted">
                    {f.mentorships.map((m) => m.group.groupCode).join(", ") || "—"}
                  </td>
                  <td className="text-brand">
                    {f.load < avg - 0.5 ? "Can take more groups" : f.load > avg + 0.5 ? "Overloaded" : "Balanced"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}
