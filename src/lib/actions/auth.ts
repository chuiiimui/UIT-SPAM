"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function loginAction(formData: FormData) {
  const uniqueId = String(formData.get("uniqueId") || "").trim();
  const password = String(formData.get("password") || "");

  try {
    const admin = await prisma.admin.findUnique({ where: { uniqueId } });
    const faculty = await prisma.faculty.findUnique({ where: { uniqueId } });
    const student = await prisma.student.findUnique({ where: { uniqueId } });

    let redirectTo = "/";
    if (admin) redirectTo = "/admin";
    else if (faculty) redirectTo = "/faculty";
    else if (student) redirectTo = "/student";

    await signIn("credentials", {
      uniqueId,
      password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid Unique Id or password." };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
