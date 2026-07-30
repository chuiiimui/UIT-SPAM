import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { facultyComment } from "@/lib/actions/app";
import { btnPrimary, Card, Field, inputClass, PageHead, Shell, Badge } from "@/components/ui";
import { facultyNav } from "@/lib/nav";
import { format } from "date-fns";

export default async function FacultyCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const facultyId = Number(session!.user.id);
  const mentorships = await prisma.groupMentor.findMany({
    where: { facultyId },
    include: { group: true },
    orderBy: { group: { groupCode: "asc" } },
  });
  const selected = Number(sp.groupId || mentorships[0]?.groupId || 0);
  const members = selected
    ? await prisma.student.findMany({ where: { groupId: selected }, orderBy: { fullName: "asc" } })
    : [];
  const comments = selected
    ? await prisma.comment.findMany({
        where: { groupId: selected },
        include: { student: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <Shell nav={facultyNav("comments")} user={session!.user}>
      <PageHead
        title="Mentor comments"
        subtitle="Comment on one student or the whole group. Flag items that need urgent action."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="New comment">
          {!mentorships.length ? (
            <p className="text-muted">No groups available.</p>
          ) : (
            <form action={facultyComment}>
              <Field label="Group">
                <select className={inputClass} name="groupId" defaultValue={selected}>
                  {mentorships.map((m) => (
                    <option key={m.groupId} value={m.groupId}>
                      {m.group.groupCode}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Audience">
                <select className={inputClass} name="studentId" defaultValue="">
                  <option value="">Whole group</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Comment">
                <textarea className={inputClass} name="body" required rows={4} />
              </Field>
              <label className="mb-4 flex items-center gap-2 text-sm">
                <input type="checkbox" name="isFlagged" /> Flag for attention
              </label>
              <button className={btnPrimary} type="submit">
                Post comment
              </button>
            </form>
          )}
        </Card>
        <Card title="Thread">
          {!comments.length ? (
            <p className="text-muted">No comments yet.</p>
          ) : (
            <div className="grid gap-4">
              {comments.map((c) => (
                <div key={c.id} className="border-b border-line pb-3 last:border-0">
                  <strong>{c.student?.fullName || "Whole group"}</strong>{" "}
                  {c.isFlagged ? <Badge tone="danger">Flagged</Badge> : null}
                  <p className="my-1">{c.body}</p>
                  <small className="text-muted">{format(c.createdAt, "dd MMM yyyy HH:mm")}</small>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Shell>
  );
}
