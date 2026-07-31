import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { APP_FULL_NAME, APP_NAME } from "@/lib/constants";
import { BrandMark, Shell } from "@/components/ui";
import { LoginForm } from "@/components/login-form";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.role === "admin") redirect("/admin");
  if (session?.user?.role === "faculty") redirect("/faculty");
  if (session?.user?.role === "student") redirect("/student");

  return (
    <Shell>
      <section className="mx-auto grid min-h-[calc(100vh-140px)] max-w-5xl items-center gap-6 py-2 sm:gap-10 sm:py-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="animate-rise">
          <BrandMark size="lg" />
          <p className="mt-4 m-0 font-[family-name:var(--font-display)] text-[clamp(2rem,8vw,3.6rem)] leading-none tracking-tight text-brand-deep sm:mt-5">
            {APP_NAME}
          </p>
          <p className="mt-3 max-w-lg text-sm font-medium text-ink-soft">{APP_FULL_NAME}</p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(1.35rem,5.5vw,2.4rem)] leading-tight sm:mt-6">
            One login. One group page. Weekly diary + rubrics.
          </h1>
          <p className="mt-3 max-w-lg text-sm text-ink-soft sm:text-base">
            Students create biodata and groups with AKTU roll numbers. Mentors evaluate weeks and
            R1–R8 on a single page. Admin assigns mentors and downloads marks — MAP-simple, built
            for campus use.
          </p>
        </div>

        <div className="rounded-[18px] border border-line bg-white/85 p-4 shadow-[var(--shadow)] backdrop-blur animate-rise sm:rounded-[22px] sm:p-6">
          <h2 className="m-0 font-[family-name:var(--font-display)] text-xl text-brand-deep sm:text-2xl">
            Login Here
          </h2>
          <p className="mt-1 mb-4 text-sm text-muted sm:mb-5">Use your Unique Id and password.</p>
          <LoginForm />
        </div>
      </section>
    </Shell>
  );
}
