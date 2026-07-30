import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname.startsWith("/notifications") && !role) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const needs = (prefix: string, expected: string) =>
    pathname.startsWith(prefix) && role !== expected;

  if (needs("/admin", "admin") || needs("/faculty", "faculty") || needs("/student", "student")) {
    const login =
      pathname.startsWith("/admin")
        ? "/login/admin"
        : pathname.startsWith("/faculty")
          ? "/login/faculty"
          : "/login/student";
    return NextResponse.redirect(new URL(login, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/faculty/:path*", "/student/:path*", "/notifications"],
};
