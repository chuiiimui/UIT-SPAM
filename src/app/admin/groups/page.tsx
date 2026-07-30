import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { adminCreateGroup, adminSetGroupStatus } from "@/lib/actions/app";
import { statusLabel } from "@/lib/constants";
import {
  Badge,
  btnGhost,
  btnPrimary,
  Card,
  Field,
  inputClass,
  PageHead,
  Shell,
  statusTone,
} from "@/components/ui";
import { adminNav } from "@/lib/nav";

export default async function AdminGroupsPage() {
  const session = await auth();
  const rows = await prisma.projectGroup.findMany({
    include: {
      students: true,
      project: true,
      mentors: { where: { isPrimary: true }, include: { faculty: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Shell nav={adminNav("groups")} user={session!.user}>
      <PageHead
        title="Project groups"
        subtitle="Register groups with temporary IDs; activate after mentor mapping and project kickoff."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card title="Register group">
          <form action={adminCreateGroup}>
            <Field label="Group code (auto if blank)">
              <input className={inputClass} name="groupCode" placeholder="GRP-2026-004" />
            </Field>
            <Field label="Group name">
              <input className={inputClass} name="groupName" placeholder="Team name" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Department">
                <input className={inputClass} name="department" defaultValue="Computer Science" />
              </Field>
              <Field label="Semester">
                <input className={inputClass} name="semester" defaultValue="VIII" />
              </Field>
            </div>
            <Field label="Academic year">
              <input className={inputClass} name="academicYear" defaultValue="2025-26" />
            </Field>
            <button className={btnPrimary} type="submit">
              Create temporary group
            </button>
          </form>
        </Card>
        <Card title="All groups">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-3">Code</th>
                  <th>Members</th>
                  <th>Mentor</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="py-3">
                      <strong>{r.groupCode}</strong>
                      <div className="text-muted">{r.groupName}</div>
                      {r.isTemporary ? <Badge tone="warn">Temporary</Badge> : null}
                    </td>
                    <td>{r.students.length}</td>
                    <td>{r.mentors[0]?.faculty.fullName || "—"}</td>
                    <td>{r.project?.title || "—"}</td>
                    <td>
                      <Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge>
                    </td>
                    <td>
                      <form action={adminSetGroupStatus} className="flex gap-2">
                        <input type="hidden" name="groupId" value={r.id} />
                        <select className={inputClass + " !w-auto !py-1.5"} name="status" defaultValue={r.status}>
                          {["pending", "active", "completed", "archived"].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <button className={btnGhost + " !py-1.5"} type="submit">
                          Save
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
