"use server";

import { prisma } from "@/lib/prisma";
import {
  logActivity,
  notify,
  notifyGroupStudents,
  requireRole,
  revalidateMany,
  saveUpload,
} from "@/lib/features/helpers";

export async function uploadSubmission(formData: FormData) {
  const user = await requireRole("student");
  const student = await prisma.student.findUnique({ where: { id: Number(user.id) } });
  if (!student?.groupId) return { error: "No group." };

  const group = await prisma.projectGroup.findUnique({ where: { id: student.groupId } });
  if (group?.submissionsLocked) return { error: "Submissions are locked by admin." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file." };

  const docType = String(formData.get("docType") || "other");
  const title = String(formData.get("title") || file.name).trim();
  const project = await prisma.project.findUnique({ where: { groupId: student.groupId } });

  const latest = await prisma.submission.findFirst({
    where: { groupId: student.groupId, docType },
    orderBy: { version: "desc" },
  });
  const version = (latest?.version || 0) + 1;
  const stored = await saveUpload(file, `group-${student.groupId}`);

  // Simple demo "similarity" heuristic for report docs
  const similarityPct =
    docType === "report" ? Math.round(8 + Math.random() * 18) : null;

  await prisma.submission.create({
    data: {
      groupId: student.groupId,
      projectId: project?.id,
      studentId: student.id,
      docType,
      title,
      ...stored,
      version,
      notes: String(formData.get("notes") || ""),
      similarityPct,
    },
  });

  await logActivity("student", student.id, "submission_upload", "group", student.groupId);
  const mentors = await prisma.groupMentor.findMany({ where: { groupId: student.groupId } });
  await Promise.all(
    mentors.map((m) =>
      notify("faculty", m.facultyId, "New submission", `${title} (v${version}) uploaded`, `/faculty/review`),
    ),
  );
  revalidateMany("/student/submissions", "/faculty/review");
  return { ok: true, similarityPct };
}

export async function addContribution(formData: FormData) {
  const user = await requireRole("student");
  const student = await prisma.student.findUnique({ where: { id: Number(user.id) } });
  if (!student?.groupId) return { error: "No group." };

  await prisma.contributionLog.create({
    data: {
      groupId: student.groupId,
      studentId: student.id,
      weekLabel: String(formData.get("weekLabel") || ""),
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || ""),
      hours: Number(formData.get("hours") || 0),
      evidence: String(formData.get("evidence") || ""),
    },
  });
  revalidateMany("/student/contribution");
  return { ok: true };
}

export async function submitPeerRating(formData: FormData) {
  const user = await requireRole("student");
  const student = await prisma.student.findUnique({ where: { id: Number(user.id) } });
  if (!student?.groupId) return { error: "No group." };
  const rateeId = Number(formData.get("rateeId"));
  if (rateeId === student.id) return { error: "Cannot rate yourself." };

  await prisma.peerRating.upsert({
    where: {
      groupId_raterId_rateeId: {
        groupId: student.groupId,
        raterId: student.id,
        rateeId,
      },
    },
    create: {
      groupId: student.groupId,
      raterId: student.id,
      rateeId,
      score: Math.max(1, Math.min(5, Number(formData.get("score") || 3))),
      note: String(formData.get("note") || ""),
    },
    update: {
      score: Math.max(1, Math.min(5, Number(formData.get("score") || 3))),
      note: String(formData.get("note") || ""),
    },
  });
  revalidateMany("/student/peers");
  return { ok: true };
}

export async function requestTeamChange(formData: FormData) {
  const user = await requireRole("student");
  const student = await prisma.student.findUnique({ where: { id: Number(user.id) } });
  if (!student?.groupId) return { error: "No group." };

  const requestType = String(formData.get("requestType") || "title_change");
  const payload = {
    detail: String(formData.get("detail") || ""),
    newTitle: String(formData.get("newTitle") || ""),
  };

  await prisma.teamChangeRequest.create({
    data: {
      groupId: student.groupId,
      requestedBy: student.id,
      requestType,
      payload: JSON.stringify(payload),
    },
  });

  const mentors = await prisma.groupMentor.findMany({ where: { groupId: student.groupId } });
  await Promise.all(
    mentors.map((m) =>
      notify("faculty", m.facultyId, "Team change request", payload.detail || requestType, "/faculty/requests"),
    ),
  );
  revalidateMany("/student/requests", "/faculty/requests");
  return { ok: true };
}

export async function markMilestoneDone(formData: FormData) {
  const user = await requireRole("student");
  const student = await prisma.student.findUnique({ where: { id: Number(user.id) } });
  if (!student?.groupId) return { error: "No group." };
  const milestone = String(formData.get("milestone") || "");

  await prisma.groupMilestone.upsert({
    where: { groupId_milestone: { groupId: student.groupId, milestone } },
    create: {
      groupId: student.groupId,
      milestone,
      status: "done",
      completedAt: new Date(),
    },
    update: { status: "done", completedAt: new Date() },
  });
  revalidateMany("/student/milestones");
  return { ok: true };
}

export async function markNotificationRead(formData: FormData) {
  const session = await requireRole(
    (String(formData.get("role") || "student") as "admin" | "faculty" | "student"),
  );
  const id = Number(formData.get("id"));
  await prisma.notification.updateMany({
    where: { id, userId: Number(session.id), role: session.role },
    data: { isRead: true },
  });
  revalidateMany("/notifications");
  return { ok: true };
}

export async function createMeeting(formData: FormData) {
  const user = await requireRole("faculty");
  const groupId = Number(formData.get("groupId"));
  const allowed = await prisma.groupMentor.findFirst({
    where: { groupId, facultyId: Number(user.id) },
  });
  if (!allowed) return { error: "Unauthorized." };

  const meeting = await prisma.meeting.create({
    data: {
      groupId,
      facultyId: Number(user.id),
      title: String(formData.get("title") || "Mentor meeting"),
      scheduledAt: new Date(String(formData.get("scheduledAt") || new Date().toISOString())),
      location: String(formData.get("location") || ""),
      notes: String(formData.get("notes") || ""),
      actionItems: String(formData.get("actionItems") || ""),
    },
  });

  const students = await prisma.student.findMany({ where: { groupId } });
  await prisma.meetingAttendance.createMany({
    data: students.map((s) => ({
      meetingId: meeting.id,
      studentId: s.id,
      present: formData.get(`present_${s.id}`) === "on",
    })),
  });

  await notifyGroupStudents(groupId, "Mentor meeting scheduled", meeting.title, "/student/meetings");
  revalidateMany("/faculty/meetings", "/student/meetings");
  return { ok: true };
}

export async function saveRubricScores(formData: FormData) {
  const user = await requireRole("faculty");
  const groupId = Number(formData.get("groupId"));
  const rubricId = Number(formData.get("rubricId"));
  const allowed = await prisma.groupMentor.findFirst({
    where: { groupId, facultyId: Number(user.id) },
  });
  if (!allowed) return { error: "Unauthorized." };

  const group = await prisma.projectGroup.findUnique({ where: { id: groupId } });
  if (group?.marksFrozen) return { error: "Marks are frozen by admin." };

  const criteria = await prisma.rubricCriterion.findMany({ where: { rubricId } });
  for (const c of criteria) {
    const marks = Number(formData.get(`criterion_${c.id}`) || 0);
    await prisma.rubricScore.create({
      data: {
        rubricId,
        criterionId: c.id,
        groupId,
        facultyId: Number(user.id),
        marks,
        note: String(formData.get(`note_${c.id}`) || ""),
      },
    });
  }

  await notifyGroupStudents(groupId, "Rubric marks posted", "Your mentor scored a rubric review.", "/student/marks");
  await logActivity("faculty", Number(user.id), "rubric_score", "group", groupId);
  revalidateMany("/faculty/rubric", "/student/marks");
  return { ok: true };
}

export async function saveVivaScore(formData: FormData) {
  const user = await requireRole("faculty");
  const groupId = Number(formData.get("groupId"));
  const allowed = await prisma.groupMentor.findFirst({
    where: { groupId, facultyId: Number(user.id) },
  });
  if (!allowed) return { error: "Unauthorized." };

  await prisma.vivaScore.create({
    data: {
      groupId,
      facultyId: Number(user.id),
      round: String(formData.get("round") || "midterm"),
      marks: Number(formData.get("marks") || 0),
      maxMarks: Number(formData.get("maxMarks") || 50),
      notes: String(formData.get("notes") || ""),
    },
  });
  await notifyGroupStudents(groupId, "Viva score recorded", "Check your marks page.", "/student/marks");
  revalidateMany("/faculty/viva", "/student/marks");
  return { ok: true };
}

export async function raiseFlag(formData: FormData) {
  const user = await requireRole("faculty");
  const groupId = Number(formData.get("groupId"));
  const allowed = await prisma.groupMentor.findFirst({
    where: { groupId, facultyId: Number(user.id) },
  });
  if (!allowed) return { error: "Unauthorized." };

  await prisma.escalationFlag.create({
    data: {
      groupId,
      facultyId: Number(user.id),
      reason: String(formData.get("reason") || "").trim(),
      severity: String(formData.get("severity") || "medium"),
    },
  });

  const admins = await prisma.admin.findMany();
  await Promise.all(
    admins.map((a) =>
      notify("admin", a.id, "Escalation flag", String(formData.get("reason") || ""), "/admin/flags"),
    ),
  );
  revalidateMany("/faculty/flags", "/admin/flags");
  return { ok: true };
}

export async function saveCommentTemplate(formData: FormData) {
  const user = await requireRole("faculty");
  await prisma.commentTemplate.create({
    data: {
      facultyId: Number(user.id),
      title: String(formData.get("title") || ""),
      body: String(formData.get("body") || ""),
    },
  });
  revalidateMany("/faculty/templates");
  return { ok: true };
}

export async function reviewTeamRequest(formData: FormData) {
  const user = await requireRole("faculty");
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") || "approved");
  const req = await prisma.teamChangeRequest.findUnique({ where: { id } });
  if (!req) return { error: "Not found." };
  const allowed = await prisma.groupMentor.findFirst({
    where: { groupId: req.groupId, facultyId: Number(user.id) },
  });
  if (!allowed) return { error: "Unauthorized." };

  await prisma.teamChangeRequest.update({
    where: { id },
    data: {
      status,
      reviewNote: String(formData.get("reviewNote") || ""),
      reviewedById: Number(user.id),
      reviewedAt: new Date(),
    },
  });

  if (status === "approved" && req.requestType === "title_change") {
    const payload = JSON.parse(req.payload || "{}") as { newTitle?: string };
    if (payload.newTitle) {
      await prisma.project.updateMany({
        where: { groupId: req.groupId },
        data: { title: payload.newTitle },
      });
    }
  }

  await notify("student", req.requestedBy, `Request ${status}`, String(formData.get("reviewNote") || status), "/student/requests");
  revalidateMany("/faculty/requests", "/student/requests");
  return { ok: true };
}

export async function createDeadline(formData: FormData) {
  const user = await requireRole("admin");
  await prisma.milestoneDeadline.create({
    data: {
      milestone: String(formData.get("milestone") || "proposal"),
      title: String(formData.get("title") || ""),
      dueAt: new Date(String(formData.get("dueAt"))),
      department: String(formData.get("department") || "") || null,
      description: String(formData.get("description") || ""),
      createdById: Number(user.id),
    },
  });

  const students = await prisma.student.findMany({ where: { isActive: true } });
  await Promise.all(
    students.map((s) =>
      notify("student", s.id, "New deadline", String(formData.get("title") || "Milestone due"), "/student/milestones"),
    ),
  );
  revalidateMany("/admin/calendar", "/student/milestones");
  return { ok: true };
}

export async function createAnnouncement(formData: FormData) {
  const user = await requireRole("admin");
  const title = String(formData.get("title") || "");
  const body = String(formData.get("body") || "");
  const audience = String(formData.get("audience") || "all");
  const department = String(formData.get("department") || "") || null;

  await prisma.announcement.create({
    data: {
      title,
      body,
      audience,
      department,
      createdById: Number(user.id),
    },
  });

  if (audience === "all" || audience === "students") {
    const students = await prisma.student.findMany({
      where: department ? { department } : undefined,
    });
    await Promise.all(students.map((s) => notify("student", s.id, title, body, "/student/announcements")));
  }
  if (audience === "all" || audience === "faculty") {
    const faculty = await prisma.faculty.findMany({
      where: department ? { department } : undefined,
    });
    await Promise.all(faculty.map((f) => notify("faculty", f.id, title, body, "/faculty")));
  }

  revalidateMany("/admin/announcements", "/student/announcements");
  return { ok: true };
}

export async function setPolicy(formData: FormData) {
  await requireRole("admin");
  const key = String(formData.get("key") || "");
  const value = String(formData.get("value") || "");
  await prisma.policySetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
  revalidateMany("/admin/policies");
  return { ok: true };
}

export async function setGroupPolicy(formData: FormData) {
  await requireRole("admin");
  const groupId = Number(formData.get("groupId"));
  await prisma.projectGroup.update({
    where: { id: groupId },
    data: {
      submissionsLocked: formData.get("submissionsLocked") === "on",
      marksFrozen: formData.get("marksFrozen") === "on",
    },
  });
  revalidateMany("/admin/policies", "/admin/groups");
  return { ok: true };
}

export async function resolveFlag(formData: FormData) {
  await requireRole("admin");
  const id = Number(formData.get("id"));
  await prisma.escalationFlag.update({
    where: { id },
    data: {
      status: String(formData.get("status") || "resolved"),
      adminNote: String(formData.get("adminNote") || ""),
      resolvedAt: new Date(),
    },
  });
  revalidateMany("/admin/flags");
  return { ok: true };
}

export async function bulkImportStudents(formData: FormData) {
  const user = await requireRole("admin");
  const csv = String(formData.get("csv") || "");
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  // header: studentId,username,fullName,email,department,enrollmentNo,groupCode,isLeader
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash("password123", 10);
  let created = 0;

  for (const line of lines.slice(1)) {
    const [studentId, username, fullName, email, department, enrollmentNo, groupCode, isLeader] =
      line.split(",").map((x) => x.trim());
    if (!studentId || !username || !fullName) continue;
    let groupId: number | null = null;
    if (groupCode) {
      const g = await prisma.projectGroup.findUnique({ where: { groupCode } });
      groupId = g?.id ?? null;
    }
    try {
      if (isLeader === "1" && groupId) {
        await prisma.student.updateMany({ where: { groupId }, data: { isLeader: false } });
      }
      await prisma.student.create({
        data: {
          studentId,
          username,
          fullName,
          email,
          department,
          enrollmentNo,
          groupId,
          isLeader: isLeader === "1",
          passwordHash: hash,
        },
      });
      created++;
    } catch {
      // skip duplicates
    }
  }

  await logActivity("admin", Number(user.id), "bulk_import_students", undefined, undefined, { created });
  revalidateMany("/admin/students", "/admin/import");
  return { ok: true, created };
}

export async function ensureDefaultRubric() {
  const existing = await prisma.rubric.findFirst({ where: { isActive: true } });
  if (existing) return existing;
  return prisma.rubric.create({
    data: {
      name: "Standard FYP Rubric",
      description: "Default campus rubric",
      criteria: {
        create: [
          { label: "Problem scope & clarity", maxMarks: 10, weight: 1, sortOrder: 1 },
          { label: "Design & architecture", maxMarks: 10, weight: 1, sortOrder: 2 },
          { label: "Implementation quality", maxMarks: 20, weight: 2, sortOrder: 3 },
          { label: "Documentation", maxMarks: 10, weight: 1, sortOrder: 4 },
          { label: "Individual contribution", maxMarks: 10, weight: 1, sortOrder: 5 },
        ],
      },
    },
    include: { criteria: true },
  });
}
