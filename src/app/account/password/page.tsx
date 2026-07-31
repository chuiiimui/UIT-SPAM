import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { adminNav, facultyNav, studentNav } from "@/lib/nav";
import { ChangePasswordForm } from "@/components/password-forms";
import { Card, PageHead, Shell } from "@/components/ui";

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const role = session.user.role;
  const nav =
    role === "admin"
      ? adminNav("password")
      : role === "faculty"
        ? facultyNav("password")
        : studentNav("password");

  return (
    <Shell nav={nav} user={session.user}>
      <PageHead
        title="Change password"
        subtitle="Update the password for your Unique Id login."
      />
      <Card title="New password">
        <ChangePasswordForm />
      </Card>
    </Shell>
  );
}
