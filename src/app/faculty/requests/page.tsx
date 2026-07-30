import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reviewTeamRequest } from "@/lib/features/actions";
import { facultyNav } from "@/lib/nav";
import { Badge, btnPrimary, btnSecondary, Card, inputClass, PageHead, Shell, statusTone } from "@/components/ui";
import { format } from "date-fns";

export default async function FacultyRequestsPage() {
  const session = await auth();
  const facultyId = Number(session!.user.id);
  const groupIds = (
    await prisma.groupMentor.findMany({ where: { facultyId }, select: { groupId: true } })
  ).map((g) => g.groupId);

  const requests = groupIds.length
    ? await prisma.teamChangeRequest.findMany({
        where: { groupId: { in: groupIds } },
        include: { group: true, requester: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <Shell nav={facultyNav("requests")} user={session!.user}>
      <PageHead title="Team edit requests" subtitle="Approve or reject student change requests." />
      <Card>
        {!requests.length ? (
          <p className="text-muted">No requests.</p>
        ) : (
          requests.map((r) => {
            const payload = JSON.parse(r.payload || "{}") as { detail?: string; newTitle?: string };
            return (
              <div key={r.id} className="border-b border-line py-4 last:border-0">
                <div className="flex flex-wrap gap-2">
                  <strong>
                    {r.group.groupCode} · {r.requestType.replaceAll("_", " ")}
                  </strong>
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </div>
                <p className="text-sm">
                  By {r.requester.fullName}: {payload.detail}
                  {payload.newTitle ? ` → “${payload.newTitle}”` : ""}
                </p>
                <small className="text-muted">{format(r.createdAt, "dd MMM yyyy HH:mm")}</small>
                {r.status === "pending" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={reviewTeamRequest} className="flex flex-wrap gap-2">
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="approved" />
                      <input className={inputClass + " !w-56"} name="reviewNote" placeholder="Optional note" />
                      <button className={btnPrimary} type="submit">
                        Approve
                      </button>
                    </form>
                    <form action={reviewTeamRequest}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="rejected" />
                      <button className={btnSecondary} type="submit">
                        Reject
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </Card>
    </Shell>
  );
}
