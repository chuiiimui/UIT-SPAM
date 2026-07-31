import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/map/session";
import { adminNav } from "@/lib/nav";
import { adminReviewGroup, assignMentor, deleteGroup } from "@/lib/map/actions";
import {
  Badge,
  Card,
  PageHead,
  Shell,
  btnAccent,
  btnPrimary,
  btnSecondary,
  inputClass,
  statusTone,
} from "@/components/ui";

export default async function AdminGroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; batch?: string }>;
}) {
  const session = await requireRole("admin");
  const sp = await searchParams;
  const q = (sp.q || "").trim().toLowerCase();
  const batchYear = sp.batch ? Number(sp.batch) : undefined;

  const batches = await prisma.batch.findMany({ orderBy: { endYear: "desc" } });
  const faculty = await prisma.faculty.findMany({
    where: { isActive: true },
    orderBy: { fullName: "asc" },
  });

  const groups = await prisma.projectGroup.findMany({
    where: batchYear ? { batch: { endYear: batchYear } } : undefined,
    include: {
      batch: true,
      students: { orderBy: { isLeader: "desc" } },
      mentors: { include: { faculty: true } },
      invites: { where: { status: "pending" } },
    },
    orderBy: [{ status: "asc" }, { id: "asc" }],
  });

  const filtered = groups.filter((g) => {
    if (!q) return true;
    const leader = g.students.find((s) => s.isLeader)?.fullName ?? "";
    return (
      g.groupCode.toLowerCase().includes(q) ||
      g.projectTitle.toLowerCase().includes(q) ||
      leader.toLowerCase().includes(q)
    );
  });

  const pendingAdmin = filtered.filter((g) => g.status === "pending_admin");

  return (
    <Shell nav={adminNav("groups")} user={session.user}>
      <PageHead
        title="Student Groups"
        subtitle="Approve formed teams, assign mentors, and open group pages."
      />

      {pendingAdmin.length > 0 ? (
        <Card title="Awaiting your approval">
          <div className="grid gap-3">
            {pendingAdmin.map((g) => {
              const leader = g.students.find((s) => s.isLeader) ?? g.students[0];
              return (
                <div
                  key={g.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3"
                >
                  <div>
                    <div className="font-semibold">{g.projectTitle}</div>
                    <div className="text-sm text-muted">
                      {g.groupCode} · Leader {leader?.fullName ?? "—"} · {g.students.length} members
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={adminReviewGroup}>
                      <input type="hidden" name="groupId" value={g.id} />
                      <input type="hidden" name="decision" value="approved" />
                      <button className={btnPrimary} type="submit">
                        Approve
                      </button>
                    </form>
                    <form action={adminReviewGroup}>
                      <input type="hidden" name="groupId" value={g.id} />
                      <input type="hidden" name="decision" value="rejected" />
                      <button className={btnSecondary} type="submit">
                        Reject
                      </button>
                    </form>
                    <Link
                      href={`/group/${g.id}`}
                      className="rounded-xl border border-line px-4 py-3 text-sm font-semibold text-ink-soft no-underline"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      <Card>
        <form className="mb-4 flex flex-wrap gap-2">
          <input
            className={`${inputClass} max-w-md flex-1`}
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search by Group ID, Project Title, or Group Leader..."
          />
          <select className={`${inputClass} max-w-[200px]`} name="batch" defaultValue={sp.batch ?? ""}>
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
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-3">Group</th>
                <th className="py-2 pr-3">Project Title</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Leader</th>
                <th className="py-2 pr-3">Mentor</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => {
                const leader = g.students.find((s) => s.isLeader) ?? g.students[0];
                const mentorId = g.mentors[0]?.facultyId ?? "";
                return (
                  <tr key={g.id} className="border-b border-line/70 align-top">
                    <td className="py-3 pr-3">
                      <div className="font-semibold">{g.groupCode}</div>
                      <div className="text-xs text-muted">{g.batch.label}</div>
                    </td>
                    <td className="py-3 pr-3">
                      <Link href={`/group/${g.id}`} className="font-medium text-brand no-underline">
                        {g.projectTitle}
                      </Link>
                      {g.invites.length > 0 ? (
                        <div className="text-xs text-warn">{g.invites.length} invite(s) pending</div>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3">
                      <Badge tone={statusTone(g.status)}>{g.status.replaceAll("_", " ")}</Badge>
                    </td>
                    <td className="py-3 pr-3">{leader?.fullName ?? "—"}</td>
                    <td className="py-3 pr-3">
                      <form action={assignMentor} className="flex gap-2">
                        <input type="hidden" name="groupId" value={g.id} />
                        <select
                          className={inputClass}
                          name="facultyId"
                          defaultValue={mentorId}
                          disabled={g.status !== "active" && g.status !== "pending_admin"}
                        >
                          <option value="">Select mentor…</option>
                          {faculty.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.fullName}
                            </option>
                          ))}
                        </select>
                        <button
                          className="rounded-xl bg-[#16a34a] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          type="submit"
                          disabled={g.status !== "active"}
                        >
                          Save
                        </button>
                      </form>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/group/${g.id}`}
                          className="rounded-xl bg-[#2563eb] px-3 py-2 text-center text-xs font-semibold text-white no-underline"
                        >
                          Open group
                        </Link>
                        <Link
                          href={`/group/${g.id}?summary=1`}
                          className="rounded-xl border border-line bg-white px-3 py-2 text-center text-xs font-semibold text-brand-deep no-underline"
                        >
                          Project summary
                        </Link>
                        <form action={deleteGroup}>
                          <input type="hidden" name="groupId" value={g.id} />
                          <button className={`${btnAccent} w-full !py-2 !text-xs`} type="submit">
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}
