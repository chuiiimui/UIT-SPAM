import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { adminCreateStudent } from "@/lib/actions/app";
import { Badge, btnPrimary, Card, Field, inputClass, PageHead, Shell } from "@/components/ui";
import { adminNav } from "@/lib/nav";

export default async function AdminStudentsPage() {
  const session = await auth();
  const [groups, rows] = await Promise.all([
    prisma.projectGroup.findMany({ orderBy: { groupCode: "asc" } }),
    prisma.student.findMany({
      include: { group: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  return (
    <Shell nav={adminNav("students")} user={session!.user}>
      <PageHead
        title="Students"
        subtitle="Each student maps to a single group and receives login credentials."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <Card title="Add student">
          <form action={adminCreateStudent}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Student ID">
                <input className={inputClass} name="studentId" required />
              </Field>
              <Field label="Username">
                <input className={inputClass} name="username" required />
              </Field>
            </div>
            <Field label="Full name">
              <input className={inputClass} name="fullName" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Enrollment no.">
                <input className={inputClass} name="enrollmentNo" />
              </Field>
              <Field label="Email">
                <input className={inputClass} name="email" type="email" />
              </Field>
            </div>
            <Field label="Department">
              <input className={inputClass} name="department" />
            </Field>
            <Field label="Map to group">
              <select className={inputClass} name="groupId" defaultValue="">
                <option value="">— Unassigned —</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.groupCode} {g.groupName || ""}
                  </option>
                ))}
              </select>
            </Field>
            <label className="mb-4 flex items-center gap-2 text-sm">
              <input type="checkbox" name="isLeader" /> Group leader
            </label>
            <Field label="Temp password">
              <input className={inputClass} name="password" defaultValue="password123" />
            </Field>
            <button className={btnPrimary} type="submit">
              Create student
            </button>
          </form>
        </Card>
        <Card title="Directory">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-3">Student</th>
                  <th>Group</th>
                  <th>Login</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="py-3">
                      <strong>{r.fullName}</strong>
                      <div className="text-muted">{r.studentId}</div>
                    </td>
                    <td>{r.group?.groupCode || "—"}</td>
                    <td>{r.username}</td>
                    <td>
                      {r.isLeader ? <Badge tone="ok">Leader</Badge> : <Badge>Member</Badge>}
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
