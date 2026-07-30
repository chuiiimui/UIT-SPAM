"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireRole(role: "admin" | "faculty" | "student") {
  const session = await auth();
  if (!session?.user || session.user.role !== role) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

async function log(actorRole: string, actorId: number, action: string, entityType?: string, entityId?: number) {
  await prisma.activityLog.create({
    data: { actorRole, actorId, action, entityType, entityId },
  });
}

export async function saveStudentProject(formData: FormData) {
  const user = await requireRole("student");
  const student = await prisma.student.findUnique({ where: { id: Number(user.id) } });
  if (!student?.groupId) return { error: "No group assigned." };

  const title = String(formData.get("title") || "").trim();
  const action = String(formData.get("action") || "save");
  if (!title) return { error: "Title is required." };

  const payload = {
    title,
    abstract: String(formData.get("abstract") || ""),
    domain: String(formData.get("domain") || ""),
    techStack: String(formData.get("techStack") || ""),
    objectives: String(formData.get("objectives") || ""),
    status: action === "submit" ? "submitted" : "draft",
    submittedAt: action === "submit" ? new Date() : undefined,
  };

  await prisma.project.upsert({
    where: { groupId: student.groupId },
    create: { groupId: student.groupId, ...payload },
    update: {
      ...payload,
      status: action === "submit" ? "submitted" : undefined,
    },
  });

  await prisma.projectGroup.update({
    where: { id: student.groupId },
    data: { status: "active", isTemporary: false },
  });

  await log("student", Number(user.id), action === "submit" ? "project_submit" : "project_save", "group", student.groupId);
  revalidatePath("/student");
  return { ok: true };
}

export async function addProgressUpdate(formData: FormData) {
  const user = await requireRole("student");
  const student = await prisma.student.findUnique({ where: { id: Number(user.id) } });
  if (!student?.groupId) return { error: "No group." };
  const project = await prisma.project.findUnique({ where: { groupId: student.groupId } });
  if (!project) return { error: "Create a project first." };

  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Title required." };

  await prisma.progressUpdate.create({
    data: {
      projectId: project.id,
      studentId: student.id,
      milestone: String(formData.get("milestone") || "proposal"),
      title,
      description: String(formData.get("description") || ""),
      percentage: Math.max(0, Math.min(100, Number(formData.get("percentage") || 0))),
    },
  });
  await log("student", student.id, "progress_add", "project", project.id);
  revalidatePath("/student/progress");
  return { ok: true };
}

export async function facultyUpdateProject(formData: FormData) {
  const user = await requireRole("faculty");
  const groupId = Number(formData.get("groupId"));
  const allowed = await prisma.groupMentor.findFirst({
    where: { groupId, facultyId: Number(user.id) },
  });
  if (!allowed) return { error: "Not assigned to this group." };

  const action = String(formData.get("action"));
  if (action === "edit") {
    await prisma.project.update({
      where: { groupId },
      data: {
        title: String(formData.get("title") || ""),
        abstract: String(formData.get("abstract") || ""),
        domain: String(formData.get("domain") || ""),
        techStack: String(formData.get("techStack") || ""),
        objectives: String(formData.get("objectives") || ""),
      },
    });
  }
  if (action === "status") {
    await prisma.project.update({
      where: { groupId },
      data: { status: String(formData.get("status") || "under_review") },
    });
  }
  if (action === "rename") {
    await prisma.projectGroup.update({
      where: { id: groupId },
      data: { groupName: String(formData.get("groupName") || "") },
    });
  }
  if (action === "leader") {
    const studentId = Number(formData.get("studentId"));
    await prisma.student.updateMany({ where: { groupId }, data: { isLeader: false } });
    await prisma.student.update({ where: { id: studentId }, data: { isLeader: true } });
  }

  await log("faculty", Number(user.id), `faculty_${action}`, "group", groupId);
  revalidatePath(`/faculty/groups/${groupId}`);
  return { ok: true };
}

export async function facultyAssess(formData: FormData) {
  const user = await requireRole("faculty");
  const groupId = Number(formData.get("groupId"));
  const allowed = await prisma.groupMentor.findFirst({
    where: { groupId, facultyId: Number(user.id) },
  });
  if (!allowed) return { error: "Unauthorized." };

  const studentRaw = String(formData.get("studentId") || "");
  await prisma.assessment.create({
    data: {
      groupId,
      facultyId: Number(user.id),
      studentId: studentRaw ? Number(studentRaw) : null,
      milestone: String(formData.get("milestone") || ""),
      marks: Number(formData.get("marks") || 0),
      maxMarks: Number(formData.get("maxMarks") || 10),
      contributionNote: String(formData.get("contributionNote") || ""),
    },
  });
  await log("faculty", Number(user.id), "assessment_add", "group", groupId);
  revalidatePath("/faculty/assess");
  return { ok: true };
}

export async function facultyComment(formData: FormData) {
  const user = await requireRole("faculty");
  const groupId = Number(formData.get("groupId"));
  const allowed = await prisma.groupMentor.findFirst({
    where: { groupId, facultyId: Number(user.id) },
  });
  if (!allowed) return { error: "Unauthorized." };
  const body = String(formData.get("body") || "").trim();
  if (!body) return { error: "Comment required." };
  const studentRaw = String(formData.get("studentId") || "");
  await prisma.comment.create({
    data: {
      groupId,
      facultyId: Number(user.id),
      studentId: studentRaw ? Number(studentRaw) : null,
      body,
      isFlagged: formData.get("isFlagged") === "on",
    },
  });
  await log("faculty", Number(user.id), "comment_add", "group", groupId);
  revalidatePath("/faculty/comments");
  return { ok: true };
}

export async function adminCreateGroup(formData: FormData) {
  const user = await requireRole("admin");
  const year = new Date().getFullYear();
  const count = await prisma.projectGroup.count({
    where: { groupCode: { startsWith: `GRP-${year}-` } },
  });
  const code =
    String(formData.get("groupCode") || "").trim() ||
    `GRP-${year}-${String(count + 1).padStart(3, "0")}`;

  await prisma.projectGroup.create({
    data: {
      groupCode: code,
      groupName: String(formData.get("groupName") || ""),
      department: String(formData.get("department") || ""),
      semester: String(formData.get("semester") || "VIII"),
      academicYear: String(formData.get("academicYear") || "2025-26"),
      status: "pending",
      isTemporary: true,
    },
  });
  await log("admin", Number(user.id), "group_create");
  revalidatePath("/admin/groups");
  return { ok: true };
}

export async function adminCreateFaculty(formData: FormData) {
  const user = await requireRole("admin");
  const bcrypt = await import("bcryptjs");
  await prisma.faculty.create({
    data: {
      facultyId: String(formData.get("facultyId") || ""),
      username: String(formData.get("username") || ""),
      passwordHash: await bcrypt.hash(String(formData.get("password") || "password123"), 10),
      fullName: String(formData.get("fullName") || ""),
      email: String(formData.get("email") || ""),
      department: String(formData.get("department") || ""),
      designation: String(formData.get("designation") || "Assistant Professor"),
    },
  });
  await log("admin", Number(user.id), "faculty_create");
  revalidatePath("/admin/faculty");
  return { ok: true };
}

export async function adminCreateStudent(formData: FormData) {
  const user = await requireRole("admin");
  const bcrypt = await import("bcryptjs");
  const groupIdRaw = String(formData.get("groupId") || "");
  const groupId = groupIdRaw ? Number(groupIdRaw) : null;
  const isLeader = formData.get("isLeader") === "on";
  if (isLeader && groupId) {
    await prisma.student.updateMany({ where: { groupId }, data: { isLeader: false } });
  }
  await prisma.student.create({
    data: {
      studentId: String(formData.get("studentId") || ""),
      username: String(formData.get("username") || ""),
      passwordHash: await bcrypt.hash(String(formData.get("password") || "password123"), 10),
      fullName: String(formData.get("fullName") || ""),
      email: String(formData.get("email") || ""),
      department: String(formData.get("department") || ""),
      enrollmentNo: String(formData.get("enrollmentNo") || ""),
      groupId,
      isLeader,
    },
  });
  await log("admin", Number(user.id), "student_create");
  revalidatePath("/admin/students");
  return { ok: true };
}

export async function adminAssignMentor(formData: FormData) {
  const user = await requireRole("admin");
  const groupId = Number(formData.get("groupId"));
  const facultyId = Number(formData.get("facultyId"));
  const isPrimary = formData.get("isPrimary") === "on";

  if (isPrimary) {
    await prisma.groupMentor.updateMany({ where: { groupId }, data: { isPrimary: false } });
  }

  await prisma.groupMentor.upsert({
    where: { groupId_facultyId: { groupId, facultyId } },
    create: {
      groupId,
      facultyId,
      assignedBy: Number(user.id),
      isPrimary,
    },
    update: {
      isPrimary,
      assignedBy: Number(user.id),
      assignedAt: new Date(),
    },
  });

  await prisma.projectGroup.update({
    where: { id: groupId },
    data: { status: "active", isTemporary: false },
  });

  await log("admin", Number(user.id), "mentor_assign", "group", groupId);
  revalidatePath("/admin/assign");
  return { ok: true };
}

export async function adminRemoveMentor(formData: FormData) {
  const user = await requireRole("admin");
  const id = Number(formData.get("mapId"));
  await prisma.groupMentor.delete({ where: { id } });
  await log("admin", Number(user.id), "mentor_remove");
  revalidatePath("/admin/assign");
  return { ok: true };
}

export async function adminSetGroupStatus(formData: FormData) {
  await requireRole("admin");
  const id = Number(formData.get("groupId"));
  const status = String(formData.get("status") || "pending");
  await prisma.projectGroup.update({
    where: { id },
    data: {
      status,
      isTemporary: status === "active" ? false : undefined,
    },
  });
  revalidatePath("/admin/groups");
  return { ok: true };
}
