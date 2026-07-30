import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { markNotificationRead } from "@/lib/features/actions";
import { Badge, btnGhost, Card, PageHead, Shell } from "@/components/ui";
import { format } from "date-fns";
import { adminNav, facultyNav, studentNav } from "@/lib/nav";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) return null;
  const role = session.user.role;
  const nav =
    role === "admin" ? adminNav("alerts") : role === "faculty" ? facultyNav("alerts") : studentNav("alerts");

  const items = await prisma.notification.findMany({
    where: { role, userId: Number(session.user.id) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <Shell nav={nav} user={session.user}>
      <PageHead title="Notifications" subtitle="Marks, deadlines, comments, escalations, and campus news." />
      <Card>
        {!items.length ? (
          <p className="text-muted">No notifications yet.</p>
        ) : (
          <div className="grid gap-3">
            {items.map((n) => (
              <div key={n.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <strong>{n.title}</strong>
                    {!n.isRead ? <Badge tone="warn">New</Badge> : null}
                  </div>
                  <p className="mt-1 mb-0 text-sm text-ink-soft">{n.body}</p>
                  <small className="text-muted">{format(n.createdAt, "dd MMM yyyy HH:mm")}</small>
                  {n.href ? (
                    <div className="mt-1">
                      <a className="text-sm font-semibold text-brand" href={n.href}>
                        Open →
                      </a>
                    </div>
                  ) : null}
                </div>
                {!n.isRead ? (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={n.id} />
                    <input type="hidden" name="role" value={role} />
                    <button className={btnGhost} type="submit">
                      Mark read
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </Shell>
  );
}
