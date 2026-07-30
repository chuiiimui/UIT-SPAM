import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { studentNav } from "@/lib/nav";
import { Card, PageHead, Shell } from "@/components/ui";
import { format } from "date-fns";

export default async function StudentAnnouncementsPage() {
  const session = await auth();
  const items = await prisma.announcement.findMany({
    where: {
      OR: [{ audience: "all" }, { audience: "students" }],
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Shell nav={studentNav("news")} user={session!.user}>
      <PageHead title="Announcements" subtitle="Campus and department notices from admin." />
      <Card>
        {!items.length ? (
          <p className="text-muted">No announcements.</p>
        ) : (
          items.map((a) => (
            <div key={a.id} className="border-b border-line py-4 last:border-0">
              <strong>{a.title}</strong>
              <div className="text-muted text-sm">{format(a.createdAt, "dd MMM yyyy HH:mm")}</div>
              <p className="mt-2 mb-0 whitespace-pre-wrap">{a.body}</p>
            </div>
          ))
        )}
      </Card>
    </Shell>
  );
}
