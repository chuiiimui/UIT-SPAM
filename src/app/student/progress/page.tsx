import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MILESTONES } from "@/lib/constants";
import { addProgressUpdate } from "@/lib/actions/app";
import {
  btnPrimary,
  Card,
  Field,
  inputClass,
  PageHead,
  Shell,
} from "@/components/ui";
import { format } from "date-fns";

import { studentNav } from "@/lib/nav";

export default async function StudentProgressPage() {
  const session = await auth();
  const student = await prisma.student.findUnique({
    where: { id: Number(session!.user.id) },
    include: {
      group: {
        include: {
          project: {
            include: {
              updates: {
                include: { student: true },
                orderBy: { createdAt: "desc" },
              },
            },
          },
          comments: {
            include: { faculty: true, student: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  const project = student?.group?.project;
  const comments = student?.group?.comments || [];

  return (
    <Shell nav={studentNav("progress")} user={session!.user}>
      <PageHead
        title="Progress timeline"
        subtitle="Log milestone updates so your mentor can review and mark contribution."
      />

      {!project ? (
        <Card>
          <p>
            Create and save your project first. <a href="/student">Go to project →</a>
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card title="Post an update">
              <form action={addProgressUpdate}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Milestone">
                    <select className={inputClass} name="milestone">
                      {Object.entries(MILESTONES).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Completion %">
                    <input className={inputClass} type="number" name="percentage" min={0} max={100} defaultValue={25} />
                  </Field>
                </div>
                <Field label="Title">
                  <input className={inputClass} name="title" required placeholder="What did you complete?" />
                </Field>
                <Field label="Description">
                  <textarea className={inputClass} name="description" rows={3} placeholder="Details, blockers, next steps..." />
                </Field>
                <button className={btnPrimary} type="submit">
                  Publish update
                </button>
              </form>
            </Card>

            <Card title="Mentor comments">
              {!comments.length ? (
                <p className="text-muted">No comments yet.</p>
              ) : (
                <div className="grid gap-4">
                  {comments.map((c) => (
                    <div key={c.id} className="border-b border-line pb-3 last:border-0">
                      <strong>{c.faculty.fullName}</strong>
                      <span className="text-muted">
                        {" "}
                        → {c.student?.fullName || "Whole group"}
                      </span>
                      <p className="my-1">{c.body}</p>
                      <small className="text-muted">{format(c.createdAt, "dd MMM yyyy HH:mm")}</small>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card title="Submitted updates">
            {!project.updates.length ? (
              <p className="text-muted">No progress logged yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted">
                      <th className="py-3">When</th>
                      <th>By</th>
                      <th>Milestone</th>
                      <th>Update</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.updates.map((u) => (
                      <tr key={u.id} className="border-t border-line">
                        <td className="py-3">{format(u.createdAt, "dd MMM yyyy")}</td>
                        <td>{u.student?.fullName || "—"}</td>
                        <td>{MILESTONES[u.milestone] || u.milestone}</td>
                        <td>
                          <strong>{u.title}</strong>
                          <div className="text-muted">{u.description}</div>
                        </td>
                        <td>{u.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </Shell>
  );
}
