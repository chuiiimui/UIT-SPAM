import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { facultyNav } from "@/lib/nav";
import { Badge, btnSecondary, Card, PageHead, Shell, statusTone } from "@/components/ui";
import { statusLabel } from "@/lib/constants";
import { format } from "date-fns";

export default async function FacultyReviewPage() {
  const session = await auth();
  const facultyId = Number(session!.user.id);
  const mentorships = await prisma.groupMentor.findMany({
    where: { facultyId },
    include: {
      group: {
        include: {
          project: true,
          submissions: { orderBy: { createdAt: "desc" }, take: 3 },
        },
      },
    },
  });

  const queue = mentorships.flatMap((m) => {
    const needs =
      m.group.project?.status === "submitted" ||
      m.group.project?.status === "under_review" ||
      m.group.submissions.length > 0;
    return needs ? [m] : [];
  });

  return (
    <Shell nav={facultyNav("review")} user={session!.user}>
      <PageHead title="Review queue" subtitle="Groups needing attention across your mentorship load." />
      <Card>
        {!queue.length ? (
          <p className="text-muted">Nothing pending right now.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-3">Group</th>
                  <th>Project status</th>
                  <th>Latest upload</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {queue.map((m) => (
                  <tr key={m.id} className="border-t border-line">
                    <td className="py-3">
                      <strong>{m.group.groupCode}</strong>
                      <div className="text-muted">{m.group.project?.title || "—"}</div>
                    </td>
                    <td>
                      {m.group.project ? (
                        <Badge tone={statusTone(m.group.project.status)}>
                          {statusLabel(m.group.project.status)}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {m.group.submissions[0]
                        ? `${m.group.submissions[0].title} · ${format(m.group.submissions[0].createdAt, "dd MMM")}`
                        : "—"}
                    </td>
                    <td>
                      <Link className={btnSecondary + " !py-2 !px-3 text-xs"} href={`/faculty/groups/${m.groupId}`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Shell>
  );
}
