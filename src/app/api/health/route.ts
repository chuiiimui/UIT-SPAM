import { NextResponse } from "next/server";
import { APP_FULL_NAME, APP_NAME } from "@/lib/constants";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: APP_NAME,
    version: "2.0.0",
    stack: "Next.js + Prisma + NextAuth",
    fullName: APP_FULL_NAME,
  });
}
