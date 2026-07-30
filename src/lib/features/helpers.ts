import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireRole(role: "admin" | "faculty" | "student") {
  const session = await auth();
  if (!session?.user || session.user.role !== role) throw new Error("Unauthorized");
  return session.user;
}

export async function logActivity(
  actorRole: string,
  actorId: number,
  action: string,
  entityType?: string,
  entityId?: number,
  meta?: Record<string, unknown>,
) {
  await prisma.activityLog.create({
    data: {
      actorRole,
      actorId,
      action,
      entityType,
      entityId,
      meta: meta ? JSON.stringify(meta) : null,
    },
  });
}

export async function notify(
  role: "admin" | "faculty" | "student",
  userId: number,
  title: string,
  body: string,
  href?: string,
) {
  await prisma.notification.create({
    data: { role, userId, title, body, href },
  });
}

export async function notifyGroupStudents(
  groupId: number,
  title: string,
  body: string,
  href?: string,
) {
  const students = await prisma.student.findMany({ where: { groupId } });
  await Promise.all(
    students.map((s) => notify("student", s.id, title, body, href)),
  );
}

export async function saveUpload(file: File, folder: string) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const fileName = `${Date.now()}-${safe}`;
  const full = path.join(dir, fileName);
  await writeFile(full, bytes);
  return {
    fileName: file.name,
    filePath: `/uploads/${folder}/${fileName}`,
    mimeType: file.type || null,
    sizeBytes: bytes.length,
  };
}

export function revalidateMany(...paths: string[]) {
  for (const p of paths) revalidatePath(p);
}
