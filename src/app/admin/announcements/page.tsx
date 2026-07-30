import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAnnouncement } from "@/lib/features/actions";
import { adminNav } from "@/lib/nav";
import { btnPrimary, Card, Field, inputClass, PageHead, Shell } from "@/components/ui";
import { format } from "date-fns";

export default async function AdminAnnouncementsPage() {
  const session = await auth();
  const items = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <Shell nav={adminNav("news")} user={session!.user}>
      <PageHead title="Announcements" subtitle="Broadcast to students, faculty, or a department." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="New announcement">
          <form action={createAnnouncement}>
            <Field label="Title">
              <input className={inputClass} name="title" required />
            </Field>
            <Field label="Audience">
              <select className={inputClass} name="audience">
                <option value="all">Everyone</option>
                <option value="students">Students</option>
                <option value="faculty">Faculty</option>
              </select>
            </Field>
            <Field label="Department filter (optional)">
              <input className={inputClass} name="department" />
            </Field>
            <Field label="Body">
              <textarea className={inputClass} name="body" rows={5} required />
            </Field>
            <button className={btnPrimary} type="submit">
              Publish
            </button>
          </form>
        </Card>
        <Card title="Published">
          {items.map((a) => (
            <div key={a.id} className="border-b border-line py-3 last:border-0">
              <strong>{a.title}</strong>
              <div className="text-muted text-sm">
                {a.audience} · {format(a.createdAt, "dd MMM yyyy")}
              </div>
              <p className="mb-0 mt-1 text-sm whitespace-pre-wrap">{a.body}</p>
            </div>
          ))}
        </Card>
      </div>
    </Shell>
  );
}
