import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Badge,
  btnPrimary,
  btnSecondary,
  Card,
  Field,
  inputClass,
  PageHead,
  Shell,
  statusTone,
} from "@/components/ui";
import { saveStudentProject } from "@/lib/actions/app";
import { statusLabel } from "@/lib/constants";
import { studentNav } from "@/lib/nav";

export default async function StudentProjectPage() {
  const session = await auth();
  const student = await prisma.student.findUnique({
    where: { id: Number(session!.user.id) },
    include: {
      group: {
        include: {
          project: true,
          mentors: { where: { isPrimary: true }, include: { faculty: true } },
        },
      },
    },
  });
  const group = student?.group;
  const project = group?.project;
  const mentor = group?.mentors[0]?.faculty;

  return (
    <Shell nav={studentNav("project")} user={session!.user}>
      <PageHead
        title="Project creation"
        subtitle="Define your final-year project. Your mentor will review once submitted."
        actions={
          group ? (
            <div className="flex flex-wrap gap-2">
              <Badge tone="info">{group.groupCode}</Badge>
              <Badge tone={statusTone(group.status)}>{statusLabel(group.status)}</Badge>
              {group.isTemporary ? <Badge tone="warn">Temporary ID</Badge> : null}
            </div>
          ) : null
        }
      />

      {!group ? (
        <Card>
          <p>No group mapped to this account. Contact the admin office.</p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card title={project ? "Update project" : "Create project"}>
            <form action={saveStudentProject}>
              <Field label="Project title">
                <input className={inputClass} name="title" required defaultValue={project?.title || ""} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Domain">
                  <input className={inputClass} name="domain" defaultValue={project?.domain || ""} />
                </Field>
                <Field label="Tech stack">
                  <input className={inputClass} name="techStack" defaultValue={project?.techStack || ""} />
                </Field>
              </div>
              <Field label="Abstract">
                <textarea className={inputClass} name="abstract" rows={4} defaultValue={project?.abstract || ""} />
              </Field>
              <Field label="Objectives">
                <textarea className={inputClass} name="objectives" rows={3} defaultValue={project?.objectives || ""} />
              </Field>
              <div className="flex flex-wrap gap-2">
                <button className={btnSecondary} name="action" value="save" type="submit">
                  Save draft
                </button>
                <button className={btnPrimary} name="action" value="submit" type="submit">
                  Submit for review
                </button>
              </div>
            </form>
          </Card>

          <div className="grid gap-4 self-start">
            <Card title="Group snapshot">
              <p className="m-0 font-semibold">{group.groupName || group.groupCode}</p>
              <p className="mt-1 text-muted">
                {group.department} · {group.academicYear} · Sem {group.semester}
              </p>
              <hr className="my-4 border-line" />
              <p className="m-0 text-sm text-muted">Project status</p>
              <div className="mt-2">
                {project ? (
                  <Badge tone={statusTone(project.status)}>{statusLabel(project.status)}</Badge>
                ) : (
                  <Badge>not created</Badge>
                )}
              </div>
            </Card>
            <Card title="Project mentor">
              {mentor ? (
                <>
                  <p className="m-0 font-semibold">{mentor.fullName}</p>
                  <p className="mt-1 text-muted">
                    {mentor.facultyId} · {mentor.designation}
                  </p>
                  <p className="text-muted">{mentor.department}</p>
                </>
              ) : (
                <p className="text-muted">Mentor not assigned yet. Admin will map a faculty advisor soon.</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </Shell>
  );
}
