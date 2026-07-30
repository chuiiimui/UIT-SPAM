import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, PageHead, Shell, statusTone } from "@/components/ui";
import { statusLabel } from "@/lib/constants";

import { studentNav } from "@/lib/nav";

export default async function StudentTeamPage() {
  const session = await auth();
  const student = await prisma.student.findUnique({
    where: { id: Number(session!.user.id) },
    include: {
      group: {
        include: {
          students: { orderBy: [{ isLeader: "desc" }, { fullName: "asc" }] },
          mentors: { where: { isPrimary: true }, include: { faculty: true } },
        },
      },
    },
  });
  const group = student?.group;
  const mentor = group?.mentors[0]?.faculty;

  return (
    <Shell nav={studentNav("team")} user={session!.user}>
      <PageHead
        title="Team & mapping"
        subtitle="Each student maps to one group. Your mentor is assigned by the admin."
      />
      {!group ? (
        <Card>
          <p>No group assigned.</p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card title={group.groupName || "Unnamed group"}>
            <p className="text-muted">
              Code <strong>{group.groupCode}</strong> ·{" "}
              <Badge tone={statusTone(group.status)}>{statusLabel(group.status)}</Badge>
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th className="py-3">Name</th>
                    <th>Student ID</th>
                    <th>Enrollment</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {group.students.map((m) => (
                    <tr key={m.id} className="border-t border-line">
                      <td className="py-3">{m.fullName}</td>
                      <td>{m.studentId}</td>
                      <td>{m.enrollmentNo}</td>
                      <td>
                        {m.isLeader ? <Badge tone="ok">Leader</Badge> : <Badge>Member</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="Faculty advisor">
            {mentor ? (
              <>
                <p className="m-0 font-semibold">{mentor.fullName}</p>
                <p className="mt-1 text-muted">Faculty ID: {mentor.facultyId}</p>
                <p className="text-muted">{mentor.email}</p>
                <p className="text-muted">
                  {mentor.designation} · {mentor.department}
                </p>
              </>
            ) : (
              <p className="text-muted">Awaiting admin assignment.</p>
            )}
          </Card>
        </div>
      )}
    </Shell>
  );
}
