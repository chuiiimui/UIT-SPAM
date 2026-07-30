import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requestTeamChange } from "@/lib/features/actions";
import { studentNav } from "@/lib/nav";
import { Badge, btnPrimary, Card, Field, inputClass, PageHead, Shell, statusTone } from "@/components/ui";
import { format } from "date-fns";

export default async function StudentRequestsPage() {
  const session = await auth();
  const student = await prisma.student.findUnique({ where: { id: Number(session!.user.id) } });
  const requests = student?.groupId
    ? await prisma.teamChangeRequest.findMany({
        where: { groupId: student.groupId },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <Shell nav={studentNav("requests")} user={session!.user}>
      <PageHead title="Change requests" subtitle="Ask mentor to approve title or team changes." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="New request">
          <form action={requestTeamChange}>
            <Field label="Type">
              <select className={inputClass} name="requestType">
                <option value="title_change">Project title change</option>
                <option value="member_swap">Member change</option>
                <option value="leader_change">Leader change</option>
              </select>
            </Field>
            <Field label="New title (if title change)">
              <input className={inputClass} name="newTitle" />
            </Field>
            <Field label="Details">
              <textarea className={inputClass} name="detail" rows={3} required />
            </Field>
            <button className={btnPrimary} type="submit">
              Submit to mentor
            </button>
          </form>
        </Card>
        <Card title="Your group requests">
          {!requests.length ? (
            <p className="text-muted">No requests yet.</p>
          ) : (
            requests.map((r) => (
              <div key={r.id} className="border-b border-line py-3 last:border-0">
                <div className="flex gap-2">
                  <strong>{r.requestType.replaceAll("_", " ")}</strong>
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </div>
                <p className="mb-0 mt-1 text-sm">{JSON.parse(r.payload || "{}").detail}</p>
                <small className="text-muted">{format(r.createdAt, "dd MMM yyyy")}</small>
              </div>
            ))
          )}
        </Card>
      </div>
    </Shell>
  );
}
