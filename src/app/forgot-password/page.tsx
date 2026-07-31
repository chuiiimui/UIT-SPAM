import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { APP_NAME } from "@/lib/constants";
import { ForgotPasswordForm } from "@/components/password-forms";
import { Shell } from "@/components/ui";

export default async function ForgotPasswordPage() {
  const session = await auth();
  if (session?.user) {
    if (session.user.role === "admin") redirect("/admin");
    if (session.user.role === "faculty") redirect("/faculty");
    redirect("/student");
  }

  return (
    <Shell>
      <section className="mx-auto max-w-md py-8 sm:py-12">
        <div className="rounded-[18px] border border-line bg-white/85 p-5 shadow-[var(--shadow)] backdrop-blur sm:rounded-[22px] sm:p-6">
          <h1 className="m-0 font-[family-name:var(--font-display)] text-2xl text-brand-deep">
            Reset password
          </h1>
          <p className="mt-2 mb-5 text-sm text-muted">
            Enter your {APP_NAME} Unique Id and the email on your account. Demo students use{" "}
            <code className="text-xs">roll@student.uit.ac.in</code>; faculty use{" "}
            <code className="text-xs">facultyN@uit.ac.in</code>; admin uses{" "}
            <code className="text-xs">principal@uit.ac.in</code>.
          </p>
          <ForgotPasswordForm />
          <p className="mb-0 mt-5 text-sm">
            <Link href="/" className="font-semibold text-brand no-underline">
              ← Back to login
            </Link>
          </p>
        </div>
      </section>
    </Shell>
  );
}
