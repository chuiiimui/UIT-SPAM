import Link from "next/link";
import { Shell, Card } from "@/components/ui";
import { LoginForm } from "@/components/login-form";

export default function AdminLoginPage() {
  return (
    <Shell>
      <div className="mx-auto w-[min(440px,100%)] animate-rise">
        <Card>
          <h1 className="mt-0 font-[family-name:var(--font-display)] text-[1.9rem]">Admin login</h1>
          <p className="mt-1 text-muted">Principal oversight — full campus database and mentor assignment.</p>
          <div className="mt-6">
            <LoginForm role="admin" callbackUrl="/admin" demoUser="principal" />
          </div>
          <p className="mt-4 text-sm text-muted">
            <Link href="/">← Back to portals</Link>
          </p>
        </Card>
      </div>
    </Shell>
  );
}
