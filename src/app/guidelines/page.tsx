import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { adminNav, facultyNav, studentNav } from "@/lib/nav";
import { Card, PageHead, Shell } from "@/components/ui";

export default async function GuidelinesPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const nav =
    session.user.role === "admin"
      ? adminNav("guidelines")
      : session.user.role === "faculty"
        ? facultyNav("guidelines")
        : studentNav("guidelines");

  return (
    <Shell nav={nav} user={session.user}>
      <PageHead
        title="Project Guidelines"
        subtitle="Aligned with UIT final-year project monitoring practice (DEC / supervisor / students)."
      />

      <Card>
        <p className="mt-0 text-ink-soft">
          The final year B.Tech. project is the development of a model or application (software or
          hardware) useful in exploring and/or solving an engineering problem.
        </p>

        <h3 className="font-[family-name:var(--font-display)] text-xl">Department Evaluation Committee (DEC)</h3>
        <ul className="text-sm text-ink-soft">
          <li>Prepare project calendar and evaluation dates (R1–R8 deadlines in Admin → Dates).</li>
          <li>Monitor timely progress and communicate status to students.</li>
          <li>Allot supervisors/mentors after groups are formed.</li>
          <li>Accept or reject project proposals during synopsis review.</li>
          <li>Decide and apply project evaluation rubrics uniformly.</li>
        </ul>

        <h3 className="font-[family-name:var(--font-display)] text-xl">Supervisor / Mentor</h3>
        <ul className="text-sm text-ink-soft">
          <li>Regularly monitor group progress via weekly diary (Week 1–8).</li>
          <li>Evaluate weekly performance as Satisfactory / Unsatisfactory.</li>
          <li>Enter rubric scores (R1–R8) per student on the group page.</li>
          <li>Ensure report/presentation quality before final submission.</li>
        </ul>

        <h3 className="font-[family-name:var(--font-display)] text-xl">Students</h3>
        <ul className="text-sm text-ink-soft">
          <li>Complete biodata, then create or join a group (1–5 members) using AKTU rolls.</li>
          <li>Submit weekly work summaries on the group page.</li>
          <li>Prepare presentations/reports aligned with R1–R8 milestones.</li>
          <li>Report to supervisor regularly and keep work evidence ready for DEC reviews.</li>
        </ul>

        <h3 className="font-[family-name:var(--font-display)] text-xl">Evaluation flow in UIT-SPAM</h3>
        <ol className="text-sm text-ink-soft">
          <li>Admin registers students & faculty; opens batch deadlines.</li>
          <li>Students form groups; admin assigns mentors.</li>
          <li>Weekly diary + mentor evaluation.</li>
          <li>Rubric R1–R8 scoring on the same group page.</li>
          <li>Admin downloads marksheet from Rubrics Marks.</li>
        </ol>
      </Card>
    </Shell>
  );
}
