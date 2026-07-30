import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, PageHead, Shell } from "@/components/ui";
import { facultyNav } from "@/lib/nav";

export default async function FacultyGroupsPage() {
  const session = await auth();
  const mentorships = await prisma.groupMentor.findMany({
    where: { facultyId: Number(session!.user.id) },
    include: { group: { include: { project: true } } },
    orderBy: { group: { groupCode: "asc" } },
  });

  return (
    <Shell nav={facultyNav("groups")} user={session!.user}>
      <PageHead
        title="Assigned groups"
        subtitle="One faculty can mentor multiple groups. Each student belongs to a single group."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {mentorships.map((m) => (
          <Link
            key={m.id}
            href={`/faculty/groups/${m.groupId}`}
            className="block rounded-[18px] border border-line bg-white/78 p-5 text-ink no-underline shadow-[var(--shadow)] transition hover:-translate-y-1"
          >
            <h3 className="m-0">
              {m.group.groupCode} · {m.group.groupName || "Group"}
            </h3>
            <p className="mt-1 text-sm text-muted">
              {m.group.project?.title || "Project not created yet"}
            </p>
            <div className="mt-3 text-xs font-semibold text-brand">
              {m.group.department} · Open workspace →
            </div>
          </Link>
        ))}
        {!mentorships.length ? (
          <Card>
            <p className="text-muted">No mentorship mappings yet.</p>
          </Card>
        ) : null}
      </div>
    </Shell>
  );
}
