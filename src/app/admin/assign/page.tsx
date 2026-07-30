import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { adminAssignMentor, adminRemoveMentor } from "@/lib/actions/app";
import { Badge, btnPrimary, Card, Field, inputClass, PageHead, Shell } from "@/components/ui";
import { adminNav } from "@/lib/nav";
import { format } from "date-fns";

function dangerBtn(className = "") {
  return `inline-flex items-center justify-center rounded-xl bg-[#fef3f2] px-3 py-2 text-sm font-semibold text-danger ${className}`;
}

export default async function AdminAssignPage() {
  const session = await auth();
  const [groups, faculty, maps] = await Promise.all([
    prisma.projectGroup.findMany({ orderBy: { groupCode: "asc" } }),
    prisma.faculty.findMany({ where: { isActive: true }, orderBy: { fullName: "asc" } }),
    prisma.groupMentor.findMany({
      include: { group: true, faculty: true },
      orderBy: [{ group: { groupCode: "asc" } }, { isPrimary: "desc" }],
    }),
  ]);

  return (
    <Shell nav={adminNav("assign")} user={session!.user}>
      <PageHead
        title="Faculty assignment"
        subtitle="Only admin can map mentors. Assignment starts the monitored project timeline."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card title="Assign project mentor">
          <form action={adminAssignMentor}>
            <Field label="Student group">
              <select className={inputClass} name="groupId" required defaultValue="">
                <option value="" disabled>
                  Select group
                </option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.groupCode} — {g.groupName || "Unnamed"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Faculty mentor">
              <select className={inputClass} name="facultyId" required defaultValue="">
                <option value="" disabled>
                  Select faculty
                </option>
                {faculty.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.facultyId} · {f.fullName} ({f.department})
                  </option>
                ))}
              </select>
            </Field>
            <label className="mb-4 flex items-center gap-2 text-sm">
              <input type="checkbox" name="isPrimary" defaultChecked /> Primary mentor
            </label>
            <button className={btnPrimary} type="submit">
              Assign mentor
            </button>
          </form>
        </Card>
        <Card title="Current mappings">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-3">Group</th>
                  <th>Faculty</th>
                  <th>Role</th>
                  <th>Assigned</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {maps.map((m) => (
                  <tr key={m.id} className="border-t border-line">
                    <td className="py-3">
                      <strong>{m.group.groupCode}</strong>
                      <div className="text-muted">{m.group.groupName}</div>
                    </td>
                    <td>
                      {m.faculty.fullName}
                      <div className="text-muted">{m.faculty.facultyId}</div>
                    </td>
                    <td>
                      {m.isPrimary ? <Badge tone="ok">Primary</Badge> : <Badge>Co-mentor</Badge>}
                    </td>
                    <td className="text-muted">{format(m.assignedAt, "dd MMM yyyy")}</td>
                    <td>
                      <form action={adminRemoveMentor}>
                        <input type="hidden" name="mapId" value={m.id} />
                        <button className={dangerBtn()} type="submit">
                          Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
