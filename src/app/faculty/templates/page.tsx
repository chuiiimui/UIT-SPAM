import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveCommentTemplate } from "@/lib/features/actions";
import { facultyNav } from "@/lib/nav";
import { btnPrimary, Card, Field, inputClass, PageHead, Shell } from "@/components/ui";

export default async function FacultyTemplatesPage() {
  const session = await auth();
  const templates = await prisma.commentTemplate.findMany({
    where: { facultyId: Number(session!.user.id) },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Shell nav={facultyNav("templates")} user={session!.user}>
      <PageHead title="Comment templates" subtitle="Reuse common mentor feedback quickly." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="New template">
          <form action={saveCommentTemplate}>
            <Field label="Title">
              <input className={inputClass} name="title" required placeholder="Add sequence diagrams" />
            </Field>
            <Field label="Body">
              <textarea
                className={inputClass}
                name="body"
                rows={5}
                required
                defaultValue="Please add sequence diagrams for the critical user flows before the next review."
              />
            </Field>
            <button className={btnPrimary} type="submit">
              Save template
            </button>
          </form>
        </Card>
        <Card title="Your library">
          {!templates.length ? (
            <p className="text-muted">No templates yet.</p>
          ) : (
            templates.map((t) => (
              <div key={t.id} className="border-b border-line py-3 last:border-0">
                <strong>{t.title}</strong>
                <p className="mb-0 mt-1 text-sm whitespace-pre-wrap">{t.body}</p>
              </div>
            ))
          )}
        </Card>
      </div>
    </Shell>
  );
}
