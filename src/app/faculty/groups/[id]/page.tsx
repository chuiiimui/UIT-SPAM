import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { facultyUpdateProject } from "@/lib/actions/app";
import { MILESTONES, statusLabel } from "@/lib/constants";
import {
  Badge,
  btnGhost,
  btnPrimary,
  btnSecondary,
  Card,
  Field,
  inputClass,
  PageHead,
  Shell,
  statusTone,
} from "@/components/ui";
import { facultyNav } from "@/lib/nav";

export default async function FacultyGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const groupId = Number(id);
  const session = await auth();
  const facultyId = Number(session!.user.id);

  const allowed = await prisma.groupMentor.findFirst({ where: { groupId, facultyId } });
  if (!allowed) redirect("/faculty");

  const group = await prisma.projectGroup.findUnique({
    where: { id: groupId },
    include: {
      project: {
        include: {
          updates: { include: { student: true }, orderBy: { createdAt: "desc" } },
        },
      },
      students: { orderBy: [{ isLeader: "desc" }, { fullName: "asc" }] },
    },
  });
  if (!group) notFound();

  return (
    <Shell nav={facultyNav("groups")} user={session!.user}>
      <PageHead
        title={group.groupCode}
        subtitle={`${group.groupName || ""} · ${group.department || ""}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link className={btnSecondary} href={`/faculty/assess?groupId=${groupId}`}>
              Give marks
            </Link>
            <Link className={btnPrimary} href={`/faculty/comments?groupId=${groupId}`}>
              Comment
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4">
          <Card title="Project oversight">
            {!group.project ? (
              <p className="text-muted">Students have not created a project yet.</p>
            ) : (
              <>
                <form action={facultyUpdateProject} className="mb-4">
                  <input type="hidden" name="groupId" value={groupId} />
                  <input type="hidden" name="action" value="edit" />
                  <Field label="Title">
                    <input className={inputClass} name="title" defaultValue={group.project.title} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Domain">
                      <input className={inputClass} name="domain" defaultValue={group.project.domain || ""} />
                    </Field>
                    <Field label="Tech stack">
                      <input className={inputClass} name="techStack" defaultValue={group.project.techStack || ""} />
                    </Field>
                  </div>
                  <Field label="Abstract">
                    <textarea className={inputClass} name="abstract" rows={3} defaultValue={group.project.abstract || ""} />
                  </Field>
                  <Field label="Objectives">
                    <textarea className={inputClass} name="objectives" rows={3} defaultValue={group.project.objectives || ""} />
                  </Field>
                  <button className={btnSecondary} type="submit">
                    Save project changes
                  </button>
                </form>
                <form action={facultyUpdateProject} className="flex flex-wrap gap-2">
                  <input type="hidden" name="groupId" value={groupId} />
                  <input type="hidden" name="action" value="status" />
                  <select className={inputClass + " !w-auto"} name="status" defaultValue={group.project.status}>
                    {["draft", "submitted", "under_review", "approved", "revision"].map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </select>
                  <button className={btnPrimary} type="submit">
                    Update status
                  </button>
                </form>
              </>
            )}
          </Card>

          <Card title="Progress feed">
            {!group.project?.updates.length ? (
              <p className="text-muted">No updates yet.</p>
            ) : (
              <div className="grid gap-4">
                {group.project.updates.map((u) => (
                  <div key={u.id} className="border-b border-line pb-3 last:border-0">
                    <strong>{u.title}</strong> · {u.percentage}%
                    <div className="text-muted">
                      {u.student?.fullName || "Member"} · {MILESTONES[u.milestone] || u.milestone}
                    </div>
                    <p className="mb-0 mt-1">{u.description}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card title="Team controls">
          <form action={facultyUpdateProject} className="mb-4">
            <input type="hidden" name="groupId" value={groupId} />
            <input type="hidden" name="action" value="rename" />
            <Field label="Group name">
              <input className={inputClass} name="groupName" defaultValue={group.groupName || ""} />
            </Field>
            <button className={btnGhost} type="submit">
              Rename
            </button>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-3">Member</th>
                  <th>Role</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {group.students.map((m) => (
                  <tr key={m.id} className="border-t border-line">
                    <td className="py-3">
                      {m.fullName}
                      <div className="text-muted">{m.studentId}</div>
                    </td>
                    <td>{m.isLeader ? "Leader" : "Member"}</td>
                    <td>
                      {!m.isLeader ? (
                        <form action={facultyUpdateProject}>
                          <input type="hidden" name="groupId" value={groupId} />
                          <input type="hidden" name="action" value="leader" />
                          <input type="hidden" name="studentId" value={m.id} />
                          <button className={btnGhost + " !py-1 !px-2 text-xs"} type="submit">
                            Make leader
                          </button>
                        </form>
                      ) : (
                        <Badge tone="ok">Leader</Badge>
                      )}
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
