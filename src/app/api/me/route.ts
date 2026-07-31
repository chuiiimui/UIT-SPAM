import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** JSON endpoints for authenticated clients */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, id } = session.user;

  if (role === "student") {
    const student = await prisma.student.findUnique({
      where: { id: Number(id) },
      include: { group: true, batch: true },
    });
    return NextResponse.json({ user: session.user, student });
  }

  if (role === "faculty") {
    const groups = await prisma.groupMentor.findMany({
      where: { facultyId: Number(id) },
      include: { group: { include: { batch: true, students: true } } },
    });
    return NextResponse.json({ user: session.user, groups });
  }

  const groups = await prisma.projectGroup.findMany({
    include: { batch: true },
    orderBy: { groupCode: "asc" },
  });
  return NextResponse.json({ user: session.user, groups });
}
