import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { adminCreateFaculty } from "@/lib/actions/app";
import { btnPrimary, Card, Field, inputClass, PageHead, Shell } from "@/components/ui";
import { adminNav } from "@/lib/nav";

export default async function AdminFacultyPage() {
  const session = await auth();
  const rows = await prisma.faculty.findMany({
    include: { _count: { select: { mentorships: true } } },
    orderBy: { fullName: "asc" },
  });

  return (
    <Shell nav={adminNav("faculty")} user={session!.user}>
      <PageHead
        title="Faculty mentors"
        subtitle="Tracked by faculty ID and name — one mentor may oversee many groups."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <Card title="Add faculty">
          <form action={adminCreateFaculty}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Faculty ID">
                <input className={inputClass} name="facultyId" required placeholder="FAC004" />
              </Field>
              <Field label="Username">
                <input className={inputClass} name="username" required />
              </Field>
            </div>
            <Field label="Full name">
              <input className={inputClass} name="fullName" required />
            </Field>
            <Field label="Email">
              <input className={inputClass} name="email" type="email" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Department">
                <input className={inputClass} name="department" />
              </Field>
              <Field label="Designation">
                <input className={inputClass} name="designation" defaultValue="Assistant Professor" />
              </Field>
            </div>
            <Field label="Temp password">
              <input className={inputClass} name="password" defaultValue="password123" />
            </Field>
            <button className={btnPrimary} type="submit">
              Create faculty
            </button>
          </form>
        </Card>
        <Card title="Directory">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-3">Faculty</th>
                  <th>Dept</th>
                  <th>Login</th>
                  <th>Groups</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="py-3">
                      <strong>{r.fullName}</strong>
                      <div className="text-muted">
                        {r.facultyId} · {r.designation}
                      </div>
                    </td>
                    <td>{r.department}</td>
                    <td>{r.username}</td>
                    <td>{r._count.mentorships}</td>
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
