import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadSubmission } from "@/lib/features/actions";
import { studentNav } from "@/lib/nav";
import { Badge, btnPrimary, Card, Field, inputClass, PageHead, Shell } from "@/components/ui";
import { format } from "date-fns";

const DOC_TYPES = [
  ["proposal", "Proposal"],
  ["srs", "SRS / Requirements"],
  ["ppt", "Presentation"],
  ["report", "Final report"],
  ["demo", "Demo video / link pack"],
  ["other", "Other"],
];

export default async function StudentSubmissionsPage() {
  const session = await auth();
  const student = await prisma.student.findUnique({ where: { id: Number(session!.user.id) } });
  const rows = student?.groupId
    ? await prisma.submission.findMany({
        where: { groupId: student.groupId },
        include: { student: true },
        orderBy: [{ docType: "asc" }, { version: "desc" }],
      })
    : [];

  return (
    <Shell nav={studentNav("submissions")} user={session!.user}>
      <PageHead
        title="Submission vault"
        subtitle="Upload proposal, SRS, PPT, report, and demos with version history."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <Card title="Upload document">
          <form action={uploadSubmission} encType="multipart/form-data">
            <Field label="Document type">
              <select className={inputClass} name="docType">
                {DOC_TYPES.map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input className={inputClass} name="title" placeholder="e.g. SRS v2" />
            </Field>
            <Field label="File">
              <input className={inputClass} type="file" name="file" required />
            </Field>
            <Field label="Notes">
              <textarea className={inputClass} name="notes" rows={2} />
            </Field>
            <button className={btnPrimary} type="submit">
              Upload version
            </button>
          </form>
        </Card>
        <Card title="Version history">
          {!rows.length ? (
            <p className="text-muted">No files uploaded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th className="py-3">Doc</th>
                    <th>Ver</th>
                    <th>By</th>
                    <th>Similarity</th>
                    <th>File</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-line">
                      <td className="py-3">
                        <strong>{r.title}</strong>
                        <div className="text-muted">{r.docType}</div>
                      </td>
                      <td>v{r.version}</td>
                      <td>
                        {r.student?.fullName}
                        <div className="text-muted">{format(r.createdAt, "dd MMM")}</div>
                      </td>
                      <td>
                        {r.similarityPct != null ? (
                          <Badge tone={r.similarityPct > 20 ? "warn" : "ok"}>{r.similarityPct}%</Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <a className="font-semibold text-brand" href={r.filePath} target="_blank">
                          Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Shell>
  );
}
