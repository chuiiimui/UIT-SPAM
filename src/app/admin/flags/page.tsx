import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveFlag } from "@/lib/features/actions";
import { adminNav } from "@/lib/nav";
import { Badge, btnPrimary, Card, inputClass, PageHead, Shell, statusTone } from "@/components/ui";
import { format } from "date-fns";

export default async function AdminFlagsPage() {
  const session = await auth();
  const flags = await prisma.escalationFlag.findMany({
    include: { group: true, faculty: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Shell nav={adminNav("flags")} user={session!.user}>
      <PageHead title="Escalations" subtitle="Faculty risk flags needing principal attention." />
      <Card>
        {!flags.length ? (
          <p className="text-muted">No flags.</p>
        ) : (
          flags.map((f) => (
            <div key={f.id} className="border-b border-line py-4 last:border-0">
              <div className="flex flex-wrap gap-2">
                <strong>{f.group.groupCode}</strong>
                <Badge tone={f.severity === "high" ? "danger" : "warn"}>{f.severity}</Badge>
                <Badge tone={statusTone(f.status)}>{f.status}</Badge>
              </div>
              <p className="text-sm">
                By {f.faculty.fullName}: {f.reason}
              </p>
              <small className="text-muted">{format(f.createdAt, "dd MMM yyyy HH:mm")}</small>
              {f.status === "open" ? (
                <form action={resolveFlag} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="status" value="resolved" />
                  <input className={inputClass + " !w-64"} name="adminNote" placeholder="Resolution note" />
                  <button className={btnPrimary} type="submit">
                    Resolve
                  </button>
                </form>
              ) : (
                <p className="text-sm text-muted">Admin note: {f.adminNote}</p>
              )}
            </div>
          ))
        )}
      </Card>
    </Shell>
  );
}
