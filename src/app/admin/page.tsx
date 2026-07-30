import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { btnGhost, btnPrimary, btnSecondary, Card, Kpi, PageHead, Shell } from "@/components/ui";
import { adminNav } from "@/lib/nav";
import { format } from "date-fns";

export default async function AdminDashboard() {
  const session = await auth();
  const [groups, students, faculty, projects, assessments, unassigned, recent] =
    await Promise.all([
      prisma.projectGroup.count(),
      prisma.student.count(),
      prisma.faculty.count(),
      prisma.project.count(),
      prisma.assessment.count(),
      prisma.projectGroup.count({
        where: { mentors: { none: { isPrimary: true } } },
      }),
      prisma.activityLog.findMany({ orderBy: { id: "desc" }, take: 12 }),
    ]);

  return (
    <Shell nav={adminNav("dash")} user={session!.user}>
      <PageHead
        title="Campus command center"
        subtitle="Full database access · Mentor assignment · Cross-role oversight"
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Kpi label="Groups" value={groups} />
        <Kpi label="Students" value={students} />
        <Kpi label="Faculty" value={faculty} />
        <Kpi label="Unassigned mentors" value={unassigned} />
        <Kpi label="Projects" value={projects} />
        <Kpi label="Assessments" value={assessments} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Quick actions">
          <div className="flex flex-wrap gap-2">
            <Link className={btnPrimary} href="/admin/assign">
              Assign faculty mentors
            </Link>
            <Link className={btnSecondary} href="/admin/groups">
              Register new group
            </Link>
            <Link className={btnSecondary} href="/admin/students">
              Add student
            </Link>
            <Link className={btnSecondary} href="/admin/faculty">
              Add faculty
            </Link>
            <Link className={btnGhost} href="/admin/reports">
              View reports
            </Link>
          </div>
          <hr className="my-4 border-line" />
          <p className="m-0 text-muted">
            Admin inherits every faculty and student capability, plus exclusive mentor assignment and
            global CRUD.
          </p>
        </Card>
        <Card title="Activity trail">
          {recent.map((r) => (
            <div key={r.id} className="border-b border-line py-2.5 text-sm last:border-0">
              <strong>{r.actorRole}</strong> · {r.action}
              <div className="text-muted">{format(r.createdAt, "dd MMM yyyy HH:mm")}</div>
            </div>
          ))}
        </Card>
      </div>
    </Shell>
  );
}
