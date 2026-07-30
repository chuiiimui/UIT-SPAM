import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { APP_FULL_NAME, APP_NAME } from "@/lib/constants";
import { BrandMark, Shell } from "@/components/ui";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.role === "admin") redirect("/admin");
  if (session?.user?.role === "faculty") redirect("/faculty");
  if (session?.user?.role === "student") redirect("/student");

  const [groups, students, faculty] = await Promise.all([
    prisma.projectGroup.count(),
    prisma.student.count(),
    prisma.faculty.count(),
  ]);

  return (
    <Shell>
      <section className="grid min-h-[calc(100vh-140px)] items-center gap-8 py-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="animate-rise">
          <div className="mb-6">
            <BrandMark size="lg" />
            <p className="mt-5 m-0 font-[family-name:var(--font-display)] text-[clamp(2.4rem,5.5vw,4rem)] leading-none tracking-tight text-brand-deep">
              {APP_NAME}
            </p>
            <p className="mt-3 max-w-xl text-sm font-medium leading-snug text-ink-soft">
              {APP_FULL_NAME}
            </p>
          </div>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,3rem)] leading-[1.1] tracking-tight">
            Final-year projects, mentored with clarity.
          </h1>
          <p className="mt-4 max-w-xl text-[1.05rem] text-ink-soft">
            One campus system for student groups, faculty mentors, and principal oversight —
            from temporary group credentials to progress marks and contribution tracking.
          </p>

          <div className="mt-8 grid gap-3">
            {[
              {
                href: "/login/student",
                title: "Student Portal",
                body: "Create projects, log progress, view mentor feedback and marks.",
              },
              {
                href: "/login/faculty",
                title: "Faculty Portal",
                body: "Monitor assigned groups, assess contribution, comment and guide.",
              },
              {
                href: "/login/admin",
                title: "Admin Portal",
                body: "Assign mentors, manage the full database, and oversee every cohort.",
              },
            ].map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="block rounded-[18px] border border-line bg-white/78 p-5 text-ink no-underline shadow-[var(--shadow)] backdrop-blur transition hover:-translate-y-1 hover:border-[rgba(51,77,147,0.35)] hover:shadow-[0_24px_50px_rgba(51,77,147,0.14)]"
              >
                <h3 className="m-0 text-[1.1rem]">{p.title}</h3>
                <p className="mt-1 text-sm text-muted">{p.body}</p>
                <div className="mt-3 text-xs font-semibold text-brand">Enter →</div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="relative min-h-[420px] overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#243771_0%,#334d93_55%,#4a63b0_100%)] p-8 text-white shadow-[var(--shadow)] animate-rise">
          <div
            className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-[18px] bg-accent/90"
            aria-hidden
          />
          <h2 className="relative m-0 font-[family-name:var(--font-display)] text-[2rem]">
            Built for UIT
          </h2>
          <p className="relative mt-3 max-w-md opacity-90">
            Role-separated experiences today. REST-ready APIs tomorrow for Android. Structured
            data for thousands of groups, assessments, and activity trails.
          </p>
          <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
            {[
              [groups, "Project groups"],
              [students, "Students"],
              [faculty, "Faculty mentors"],
            ].map(([n, label]) => (
              <div
                key={String(label)}
                className="rounded-2xl border border-white/18 bg-white/12 p-4"
              >
                <strong className="block font-[family-name:var(--font-display)] text-[1.4rem]">
                  {n}
                </strong>
                <span className="text-xs opacity-85">{label}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </Shell>
  );
}
