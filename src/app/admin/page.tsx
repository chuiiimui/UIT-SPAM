import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/map/session";
import { adminNav } from "@/lib/nav";
import { Kpi, PageHead, Shell } from "@/components/ui";

const tiles = [
  { href: "/admin/groups", title: "Groups", body: "Search groups, assign mentors, open reviews", color: "bg-[#2563eb]" },
  { href: "/admin/rubrics", title: "Rubrics", body: "R1–R8 catalog, status, and scoring", color: "bg-[#0d9488]" },
  { href: "/admin/dates", title: "Manage Dates", body: "Set R1–R8 deadlines per batch", color: "bg-[#16a34a]" },
  { href: "/admin/marks", title: "Marks sheet", body: "View and download student marksheet", color: "bg-[#0891b2]" },
  { href: "/admin/students", title: "Students", body: "Register students with AKTU rolls", color: "bg-[#334d93]" },
  { href: "/admin/import", title: "CSV Import", body: "Bulk-register students from a spreadsheet", color: "bg-[#0f766e]" },
  { href: "/admin/faculty", title: "Faculty", body: "Add mentors / supervisors", color: "bg-[#7c3aed]" },
  { href: "/guidelines", title: "Guidelines", body: "DEC / supervisor / student rules", color: "bg-[#d62027]" },
];

export default async function AdminHomePage() {
  const session = await requireRole("admin");
  const [groups, students, faculty, batches] = await Promise.all([
    prisma.projectGroup.count(),
    prisma.student.count(),
    prisma.faculty.count(),
    prisma.batch.count(),
  ]);

  return (
    <Shell nav={adminNav("home")} user={session.user}>
      <PageHead title="Admin Home" subtitle="MAP-style controls for UIT-SPAM — simple and production-ready." />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Batches" value={batches} />
        <Kpi label="Groups" value={groups} />
        <Kpi label="Students" value={students} />
        <Kpi label="Faculty" value={faculty} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`${t.color} rounded-2xl p-4 text-white no-underline shadow-[var(--shadow)] transition sm:p-6 sm:hover:-translate-y-1`}
          >
            <h2 className="m-0 font-[family-name:var(--font-display)] text-xl sm:text-2xl">{t.title}</h2>
            <p className="mt-2 mb-0 text-sm text-white/90">{t.body}</p>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
