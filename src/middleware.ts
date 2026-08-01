import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  const protectedPrefixes = [
    "/admin",
    "/faculty",
    "/student",
    "/students",
    "/group",
    "/guidelines",
    "/account",
  ];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (isProtected && !role) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/faculty") && role !== "faculty") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/student") && !pathname.startsWith("/students") && role !== "student") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/students") && role !== "admin" && role !== "faculty") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/faculty/:path*",
    "/student/:path*",
    "/students/:path*",
    "/group/:path*",
    "/guidelines",
    "/account/:path*",
  ],
};
