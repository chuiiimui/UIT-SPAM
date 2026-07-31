import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/constants";

export async function requireRole(role: Role) {
  const session = await auth();
  if (!session?.user || session.user.role !== role) {
    redirect("/");
  }
  return session;
}

export async function requireAnyRole(roles: Role[]) {
  const session = await auth();
  if (!session?.user || !roles.includes(session.user.role)) {
    redirect("/");
  }
  return session;
}
