"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import type { Role } from "@/lib/constants";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "") as Role;
  const callbackUrl = String(formData.get("callbackUrl") || "/");

  try {
    await signIn("credentials", {
      username,
      password,
      role,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid credentials. Please try again." };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
