import Link from "next/link";
import { Shell, Card } from "@/components/ui";
import { LoginForm } from "@/components/login-form";

export default function FacultyLoginPage() {
  return (
    <Shell>
      <div className="mx-auto w-[min(440px,100%)] animate-rise">
        <Card>
          <h1 className="mt-0 font-[family-name:var(--font-display)] text-[1.9rem]">Faculty login</h1>
          <p className="mt-1 text-muted">Monitor assigned groups and record progress assessments.</p>
          <div className="mt-6">
            <LoginForm role="faculty" callbackUrl="/faculty" demoUser="faculty1" />
          </div>
          <p className="mt-4 text-sm text-muted">
            <Link href="/">← Back to portals</Link>
          </p>
        </Card>
      </div>
    </Shell>
  );
}
