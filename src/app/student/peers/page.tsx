import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { submitPeerRating } from "@/lib/features/actions";
import { studentNav } from "@/lib/nav";
import { btnPrimary, Card, Field, inputClass, PageHead, Shell } from "@/components/ui";

export default async function PeersPage() {
  const session = await auth();
  const me = await prisma.student.findUnique({ where: { id: Number(session!.user.id) } });
  const teammates = me?.groupId
    ? await prisma.student.findMany({
        where: { groupId: me.groupId, NOT: { id: me.id } },
        orderBy: { fullName: "asc" },
      })
    : [];
  const ratings = me?.groupId
    ? await prisma.peerRating.findMany({
        where: { groupId: me.groupId },
        include: { rater: true, ratee: true },
      })
    : [];

  return (
    <Shell nav={studentNav("peers")} user={session!.user}>
      <PageHead title="Peer ratings" subtitle="Optional teammate contribution scores (1–5) for mentor context." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Rate a teammate">
          {!teammates.length ? (
            <p className="text-muted">No teammates found.</p>
          ) : (
            <form action={submitPeerRating}>
              <Field label="Teammate">
                <select className={inputClass} name="rateeId">
                  {teammates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Score (1-5)">
                <input className={inputClass} type="number" min={1} max={5} name="score" defaultValue={4} />
              </Field>
              <Field label="Note">
                <textarea className={inputClass} name="note" rows={3} />
              </Field>
              <button className={btnPrimary} type="submit">
                Submit rating
              </button>
            </form>
          )}
        </Card>
        <Card title="Group ratings">
          {!ratings.length ? (
            <p className="text-muted">No ratings yet.</p>
          ) : (
            ratings.map((r) => (
              <div key={r.id} className="border-b border-line py-2 last:border-0 text-sm">
                <strong>{r.rater.fullName}</strong> → {r.ratee.fullName}: <strong>{r.score}/5</strong>
                <div className="text-muted">{r.note}</div>
              </div>
            ))
          )}
        </Card>
      </div>
    </Shell>
  );
}
