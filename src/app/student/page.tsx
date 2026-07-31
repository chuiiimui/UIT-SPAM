import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/map/session";
import { studentNav } from "@/lib/nav";
import { Badge, Card, PageHead, Shell } from "@/components/ui";
import {
  BiodataForm,
  CreateGroupForm,
  InviteResponseButtons,
} from "@/components/student-home-forms";
import { ToastFromQuery } from "@/components/alerts";

export default async function StudentHomePage() {
  const session = await requireRole("student");
  const student = await prisma.student.findUnique({
    where: { id: Number(session.user.id) },
    include: { group: true, batch: true },
  });
  if (!student) redirect("/");

  if (student.groupId) {
    redirect(`/group/${student.groupId}`);
  }

  const invites = student.biodataComplete
    ? await prisma.groupInvite.findMany({
        where: { aktuRoll: student.uniqueId, status: "pending" },
        include: {
          group: {
            include: {
              batch: true,
              students: { where: { isLeader: true }, take: 1 },
            },
          },
          invitedBy: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <Shell nav={studentNav("home")} user={session.user}>
      <ToastFromQuery />
      <PageHead
        title={`Hello, ${student.fullName}`}
        subtitle={
          student.biodataComplete
            ? "Create a group, or approve invites from other leaders."
            : "Complete your biodata to continue."
        }
      />

      {!student.biodataComplete ? (
        <Card title="Student biodata">
          <BiodataForm
            uniqueId={student.uniqueId}
            defaults={{
              fullName: student.fullName,
              email: student.email ?? "",
              phone: student.phone ?? "",
              department: student.department ?? "CSE",
              branch: student.branch ?? "CSE",
              section: student.section ?? "",
              semester: student.semester ?? "VII",
              bioNote: student.bioNote ?? "",
            }}
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {invites.length > 0 ? (
            <Card title="Pending group invites">
              <p className="mt-0 text-sm text-muted">
                Approve an invite to join that team. After members accept, the group goes to admin for
                approval.
              </p>
              <div className="grid gap-3">
                {invites.map((inv) => {
                  const leader = inv.group.students[0] ?? inv.invitedBy;
                  return (
                    <div
                      key={inv.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3"
                    >
                      <div>
                        <div className="font-semibold">{inv.group.projectTitle}</div>
                        <div className="text-sm text-muted">
                          {inv.group.groupCode} · {inv.group.batch.label} · Invited by{" "}
                          {leader.fullName}
                        </div>
                      </div>
                      <InviteResponseButtons inviteId={inv.id} />
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : null}

          <Card title="Create a group">
            <CreateGroupForm batchLabel={student.batch?.label ?? "Not assigned"} />
            <div className="mt-4 text-sm">
              <Link href="/guidelines" className="font-semibold text-brand no-underline">
                Read project guidelines →
              </Link>
            </div>
          </Card>

          {invites.length === 0 ? (
            <p className="m-0 text-sm text-muted">
              No pending invites. <Badge>Waiting for a leader to invite you</Badge>
            </p>
          ) : null}
        </div>
      )}
    </Shell>
  );
}
