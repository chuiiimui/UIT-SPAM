import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { adminNav, facultyNav } from "@/lib/nav";
import { Badge, Card, PageHead, Shell } from "@/components/ui";

export default async function StudentBiodataPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const role = session.user.role;
  if (role !== "admin" && role !== "faculty") redirect("/");

  const { id } = await params;
  const studentId = Number(id);
  if (!studentId) notFound();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      batch: true,
      group: {
        include: {
          mentors: { include: { faculty: true } },
          students: { orderBy: [{ isLeader: "desc" }, { fullName: "asc" }] },
        },
      },
    },
  });
  if (!student) notFound();

  if (role === "faculty") {
    const facultyId = Number(session.user.id);
    if (!student.groupId) {
      // Faculty may still view ungrouped students only if admin — block otherwise
      redirect("/faculty");
    }
    const mentorship = await prisma.groupMentor.findFirst({
      where: { facultyId, groupId: student.groupId },
    });
    if (!mentorship) redirect("/faculty");
  }

  const nav = role === "admin" ? adminNav("students") : facultyNav("home");
  const mentor = student.group?.mentors[0]?.faculty;
  const backHref = student.groupId
    ? `/group/${student.groupId}`
    : role === "admin"
      ? "/admin/students"
      : "/faculty";

  const fields: { label: string; value: string }[] = [
    { label: "Full name", value: student.fullName },
    { label: "AKTU roll (Unique Id)", value: student.uniqueId },
    { label: "Email", value: student.email || "—" },
    { label: "Phone", value: student.phone || "—" },
    { label: "Department", value: student.department || "—" },
    { label: "Branch", value: student.branch || "—" },
    { label: "Section", value: student.section || "—" },
    { label: "Semester", value: student.semester || "—" },
    { label: "Batch", value: student.batch?.label || "—" },
    {
      label: "Biodata status",
      value: student.biodataComplete ? "Complete" : "Incomplete",
    },
    {
      label: "Group role",
      value: student.groupId ? (student.isLeader ? "Leader" : "Member") : "Not in a group",
    },
  ];

  return (
    <Shell nav={nav} user={session.user}>
      <PageHead
        title={student.fullName}
        subtitle="Student biodata"
        actions={
          <div className="flex flex-wrap gap-2">
            {student.groupId ? (
              <Link
                href={`/group/${student.groupId}`}
                className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white no-underline"
              >
                Open group
              </Link>
            ) : null}
            <Link
              href={backHref}
              className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-brand-deep no-underline"
            >
              Back
            </Link>
          </div>
        }
      />

      <Card title="Profile">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge tone={student.biodataComplete ? "ok" : "warn"}>
            {student.biodataComplete ? "Biodata complete" : "Biodata pending"}
          </Badge>
          {student.isActive ? <Badge tone="info">Active</Badge> : <Badge tone="danger">Inactive</Badge>}
          {student.group ? (
            <Badge tone="muted">{student.group.groupCode}</Badge>
          ) : (
            <Badge>No group</Badge>
          )}
        </div>

        <dl className="m-0 grid gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label} className="rounded-xl border border-line bg-brand-mist/40 px-3 py-2.5">
              <dt className="m-0 text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
                {f.label}
              </dt>
              <dd className="m-0 mt-0.5 text-sm font-medium text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>

        {student.bioNote?.trim() ? (
          <div className="mt-4">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-wide text-muted">Short bio</h3>
            <p className="mt-2 mb-0 whitespace-pre-wrap text-sm text-ink-soft">{student.bioNote}</p>
          </div>
        ) : null}
      </Card>

      {student.group ? (
        <Card title="Group">
          <p className="mt-0 text-sm text-ink-soft">
            <strong>{student.group.projectTitle}</strong>
            <span className="text-muted">
              {" "}
              · {student.group.groupCode}
              {mentor ? ` · Mentor: ${mentor.fullName}` : ""}
            </span>
          </p>
          <ul className="m-0 list-none space-y-1.5 p-0">
            {student.group.students.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
              >
                {m.id === student.id ? (
                  <strong>{m.fullName}</strong>
                ) : (
                  <Link
                    href={`/students/${m.id}`}
                    className="font-semibold text-brand no-underline hover:underline"
                  >
                    {m.fullName}
                  </Link>
                )}
                <span className="text-muted">
                  {" "}
                  · {m.uniqueId}
                  {m.isLeader ? " · Leader" : ""}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </Shell>
  );
}
