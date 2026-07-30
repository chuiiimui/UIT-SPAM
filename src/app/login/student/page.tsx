import Link from "next/link";
import { Shell, Card } from "@/components/ui";
import { LoginForm } from "@/components/login-form";

export default function StudentLoginPage() {
  return (
    <Shell>
      <div className="mx-auto w-[min(440px,100%)] animate-rise">
        <Card>
          <h1 className="mt-0 font-[family-name:var(--font-display)] text-[1.9rem]">Student login</h1>
          <p className="mt-1 text-muted">Use your group credentials to open the project workspace.</p>
          <div className="mt-6">
            <LoginForm role="student" callbackUrl="/student" demoUser="stu_lead1" />
          </div>
          <p className="mt-4 text-sm text-muted">
            <Link href="/">← Back to portals</Link>
          </p>
        </Card>
      </div>
    </Shell>
  );
}
