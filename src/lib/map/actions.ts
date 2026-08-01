"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAktuRoll, MAX_GROUP_SIZE } from "@/lib/constants";
import { isRubricCode, isRubricUnlocked, RUBRICS, WEEK_COUNT } from "@/lib/map/rubrics";
import { fail, ok, type ActionResult } from "@/lib/map/result";

async function log(action: string, entityType?: string, entityId?: number, meta?: string) {
  const session = await auth();
  await prisma.activityLog.create({
    data: {
      actorRole: session?.user?.role,
      actorId: session?.user?.id ? Number(session.user.id) : null,
      action,
      entityType,
      entityId,
      meta,
    },
  });
}

function revalidateGroup(groupId: number) {
  revalidatePath(`/group/${groupId}`);
  revalidatePath("/student");
  revalidatePath("/student/rubrics");
  revalidatePath("/faculty");
  revalidatePath("/faculty/rubrics");
  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath("/admin/rubrics");
  revalidatePath("/admin/marks");
}

export async function saveBiodata(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "student") return fail("Unauthorized.");

  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const department = String(formData.get("department") || "").trim() || null;
  const branch = String(formData.get("branch") || "").trim() || null;
  const section = String(formData.get("section") || "").trim() || null;
  const semester = String(formData.get("semester") || "").trim() || null;
  const bioNote = String(formData.get("bioNote") || "").trim() || null;

  if (!fullName) return fail("Full name is required.");

  await prisma.student.update({
    where: { id: Number(session.user.id) },
    data: {
      fullName,
      email,
      phone,
      department,
      branch,
      section,
      semester,
      bioNote,
      biodataComplete: true,
    },
  });

  await log("biodata_saved", "student", Number(session.user.id));
  revalidatePath("/student");
  return ok("Biodata saved.", "/student");
}

export async function createGroup(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "student") return fail("Unauthorized.");

  const student = await prisma.student.findUnique({ where: { id: Number(session.user.id) } });
  if (!student) return fail("Student not found.");
  if (!student.biodataComplete) return fail("Complete your biodata first.");
  if (student.groupId) return fail("You are already in a group.");

  const projectTitle = String(formData.get("projectTitle") || "").trim();
  if (!projectTitle) return fail("Project title is required.");

  const batchId = student.batchId;
  if (!batchId) return fail("Your account has no batch assigned. Contact admin.");

  const count = await prisma.projectGroup.count({ where: { batchId } });
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  const groupCode = `GRP-${batch?.endYear ?? "NA"}-${String(count + 1).padStart(3, "0")}`;

  const group = await prisma.projectGroup.create({
    data: {
      groupCode,
      projectTitle,
      batchId,
      status: "forming",
      students: { connect: [{ id: student.id }] },
    },
  });

  await prisma.student.update({
    where: { id: student.id },
    data: { isLeader: true, groupId: group.id },
  });

  for (let week = 1; week <= WEEK_COUNT; week++) {
    await prisma.weeklyEntry.create({
      data: { groupId: group.id, weekNumber: week, summary: "" },
    });
  }

  await log("group_created", "group", group.id, groupCode);
  revalidateGroup(group.id);
  return ok("Group created.", `/group/${group.id}`);
}

export async function searchStudentsForInvite(query: string, groupId: number) {
  const session = await auth();
  if (session?.user?.role !== "student") return [];

  const leader = await prisma.student.findUnique({ where: { id: Number(session.user.id) } });
  if (!leader?.isLeader || leader.groupId !== groupId) return [];

  const group = await prisma.projectGroup.findUnique({
    where: { id: groupId },
    include: { invites: { where: { status: "pending" } } },
  });
  if (!group || group.status !== "forming") return [];

  const q = query.trim();
  if (q.length < 2) return [];

  const pendingRolls = group.invites.map((i) => i.aktuRoll);

  const matches = await prisma.student.findMany({
    where: {
      isActive: true,
      biodataComplete: true,
      groupId: null,
      batchId: group.batchId,
      id: { not: leader.id },
      uniqueId: { notIn: pendingRolls.length ? pendingRolls : ["__none__"] },
      OR: [
        { fullName: { contains: q } },
        { uniqueId: { contains: q } },
      ],
    },
    select: {
      id: true,
      uniqueId: true,
      fullName: true,
      department: true,
      section: true,
      branch: true,
    },
    take: 12,
    orderBy: { fullName: "asc" },
  });

  return matches;
}

export async function inviteStudentToGroup(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "student") return fail("Unauthorized.");

  const groupId = Number(formData.get("groupId"));
  const aktuRoll = String(formData.get("aktuRoll") || "").trim();
  if (!groupId || !aktuRoll) return fail("Select a student to invite.");

  const leader = await prisma.student.findUnique({ where: { id: Number(session.user.id) } });
  if (!leader?.isLeader || leader.groupId !== groupId) {
    return fail("Only the group leader can send invites.");
  }

  const group = await prisma.projectGroup.findUnique({
    where: { id: groupId },
    include: { students: true, invites: { where: { status: "pending" } } },
  });
  if (!group || group.status !== "forming") {
    return fail("Invites are only allowed while the group is forming.");
  }

  const seatsTaken = group.students.length + group.invites.length;
  if (seatsTaken >= MAX_GROUP_SIZE) {
    return fail(`Group cannot exceed ${MAX_GROUP_SIZE} members (including pending invites).`);
  }

  const target = await prisma.student.findUnique({ where: { uniqueId: aktuRoll } });
  if (!target) return fail("Student not found.");
  if (!target.biodataComplete) return fail("That student has not completed biodata yet.");
  if (target.groupId) return fail("That student is already in another group.");
  if (target.batchId !== group.batchId) return fail("Student belongs to a different batch.");
  if (target.id === leader.id) return fail("You cannot invite yourself.");

  const existing = await prisma.groupInvite.findUnique({
    where: { groupId_aktuRoll: { groupId, aktuRoll } },
  });
  if (existing?.status === "pending") return fail("Invite already pending for this student.");
  if (existing?.status === "accepted") return fail("This student already accepted an invite.");

  if (existing) {
    await prisma.groupInvite.update({
      where: { id: existing.id },
      data: { status: "pending", invitedById: leader.id },
    });
  } else {
    await prisma.groupInvite.create({
      data: {
        groupId,
        aktuRoll,
        invitedById: leader.id,
        status: "pending",
      },
    });
  }

  await log("member_invited", "group", groupId, aktuRoll);
  revalidateGroup(groupId);
  revalidatePath("/student");
  return ok(`Invite sent to ${target.fullName}.`);
}

export async function cancelInvite(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "student") return fail("Unauthorized.");

  const inviteId = Number(formData.get("inviteId"));
  const invite = await prisma.groupInvite.findUnique({
    where: { id: inviteId },
    include: { group: true },
  });
  if (!invite || invite.status !== "pending") return fail("Invite not found.");

  const leader = await prisma.student.findUnique({ where: { id: Number(session.user.id) } });
  if (!leader?.isLeader || leader.groupId !== invite.groupId) {
    return fail("Only the group leader can cancel invites.");
  }
  if (invite.group.status !== "forming") return fail("Group is no longer forming.");

  await prisma.groupInvite.delete({ where: { id: inviteId } });
  await log("invite_cancelled", "group", invite.groupId, invite.aktuRoll);
  revalidateGroup(invite.groupId);
  revalidatePath("/student");
  return ok("Invite cancelled.");
}

export async function respondToInvite(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "student") return fail("Unauthorized.");

  const inviteId = Number(formData.get("inviteId"));
  const decision = String(formData.get("decision") || "");
  if (!["accepted", "rejected"].includes(decision)) return fail("Invalid decision.");

  const student = await prisma.student.findUnique({ where: { id: Number(session.user.id) } });
  if (!student) return fail("Student not found.");
  if (student.groupId) return fail("You are already in a group.");

  const invite = await prisma.groupInvite.findUnique({
    where: { id: inviteId },
    include: {
      group: { include: { students: true, invites: { where: { status: "pending" } } } },
    },
  });
  if (!invite || invite.status !== "pending") return fail("Invite is no longer available.");
  if (invite.aktuRoll !== student.uniqueId) return fail("This invite is not for your account.");
  if (invite.group.status !== "forming") return fail("That group is no longer accepting members.");

  if (decision === "rejected") {
    await prisma.groupInvite.update({
      where: { id: inviteId },
      data: { status: "rejected" },
    });
    await log("invite_rejected", "group", invite.groupId, student.uniqueId);
    await maybeMoveGroupToAdminReview(invite.groupId);
    revalidateGroup(invite.groupId);
    revalidatePath("/student");
    return ok("Invite rejected.");
  }

  if (invite.group.students.length >= MAX_GROUP_SIZE) {
    return fail("This group is already full.");
  }

  await prisma.groupInvite.update({
    where: { id: inviteId },
    data: { status: "accepted" },
  });
  await prisma.student.update({
    where: { id: student.id },
    data: { groupId: invite.groupId, isLeader: false },
  });

  await log("invite_accepted", "group", invite.groupId, student.uniqueId);
  await maybeMoveGroupToAdminReview(invite.groupId);
  revalidateGroup(invite.groupId);
  revalidatePath("/student");
  return ok("Joined group.", `/group/${invite.groupId}`);
}

export async function submitGroupForAdmin(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "student") return fail("Unauthorized.");

  const groupId = Number(formData.get("groupId"));
  const leader = await prisma.student.findUnique({ where: { id: Number(session.user.id) } });
  if (!leader?.isLeader || leader.groupId !== groupId) {
    return fail("Only the group leader can submit for approval.");
  }

  const pending = await prisma.groupInvite.count({
    where: { groupId, status: "pending" },
  });
  if (pending > 0) {
    return fail(`Wait for ${pending} pending invite${pending > 1 ? "s" : ""} to be accepted or cancelled.`);
  }

  const group = await prisma.projectGroup.findUnique({ where: { id: groupId } });
  if (!group || group.status !== "forming") {
    return fail("Group cannot be submitted in its current status.");
  }

  await prisma.projectGroup.update({
    where: { id: groupId },
    data: { status: "pending_admin" },
  });
  await log("group_submitted_admin", "group", groupId);
  revalidateGroup(groupId);
  return ok("Group submitted for admin approval.");
}

async function maybeMoveGroupToAdminReview(groupId: number) {
  const group = await prisma.projectGroup.findUnique({
    where: { id: groupId },
    include: { invites: { where: { status: "pending" } } },
  });
  if (!group || group.status !== "forming") return;
  // Only auto-submit after at least one invite was sent and none remain pending
  const anyInvite = await prisma.groupInvite.count({ where: { groupId } });
  if (anyInvite === 0) return;
  if (group.invites.length > 0) return;

  await prisma.projectGroup.update({
    where: { id: groupId },
    data: { status: "pending_admin" },
  });
  await log("group_auto_pending_admin", "group", groupId);
}

export async function adminReviewGroup(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "admin") return;

  const groupId = Number(formData.get("groupId"));
  const decision = String(formData.get("decision") || "");
  if (!groupId || !["approved", "rejected"].includes(decision)) return;

  const group = await prisma.projectGroup.findUnique({ where: { id: groupId } });
  if (!group || group.status !== "pending_admin") return;

  if (decision === "approved") {
    await prisma.projectGroup.update({
      where: { id: groupId },
      data: { status: "active" },
    });
    await log("group_approved", "group", groupId);
  } else {
    await prisma.student.updateMany({
      where: { groupId },
      data: { groupId: null, isLeader: false },
    });
    await prisma.groupInvite.deleteMany({ where: { groupId } });
    await prisma.projectGroup.update({
      where: { id: groupId },
      data: { status: "rejected" },
    });
    await log("group_rejected", "group", groupId);
  }

  revalidateGroup(groupId);
  revalidatePath("/admin/groups");
}

export async function updateProjectTitle(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized.");

  const groupId = Number(formData.get("groupId"));
  const projectTitle = String(formData.get("projectTitle") || "").trim();
  if (!groupId || !projectTitle) return fail("Title is required.");

  const allowed = await canAccessGroup(session.user.role, Number(session.user.id), groupId);
  if (!allowed) return fail("Unauthorized.");

  if (session.user.role === "student") {
    const student = await prisma.student.findUnique({ where: { id: Number(session.user.id) } });
    if (!student?.isLeader) return fail("Only the group leader can rename the project.");
  }

  await prisma.projectGroup.update({
    where: { id: groupId },
    data: { projectTitle },
  });
  await log("project_title_updated", "group", groupId, projectTitle);
  revalidateGroup(groupId);
  return ok("Project title saved.");
}

export async function saveProjectSummary(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized.");

  const groupId = Number(formData.get("groupId"));
  if (!groupId) return fail("Group required.");

  const allowed = await canAccessGroup(session.user.role, Number(session.user.id), groupId);
  if (!allowed) return fail("Unauthorized.");

  if (session.user.role === "student") {
    const student = await prisma.student.findUnique({ where: { id: Number(session.user.id) } });
    if (!student?.isLeader) return fail("Only the group leader can edit the summary.");
  }

  const projectTitle = String(formData.get("projectTitle") || "").trim();
  const projectAbout = String(formData.get("projectAbout") || "").trim();
  const domain = String(formData.get("domain") || "").trim();
  const objectives = String(formData.get("objectives") || "").trim();
  const techStack = String(formData.get("techStack") || "").trim();

  if (!projectTitle) return fail("Project title is required.");

  await prisma.projectGroup.update({
    where: { id: groupId },
    data: { projectTitle, projectAbout, domain, objectives, techStack },
  });
  await log("project_summary_saved", "group", groupId);
  revalidateGroup(groupId);
  return ok("Project summary saved.");
}

export async function saveWeeklySummary(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "student") return fail("Unauthorized.");

  const groupId = Number(formData.get("groupId"));
  const weekNumber = Number(formData.get("weekNumber"));
  const summary = String(formData.get("summary") || "").trim();
  if (!groupId || weekNumber < 1 || weekNumber > WEEK_COUNT) return fail("Invalid week.");

  const student = await prisma.student.findUnique({ where: { id: Number(session.user.id) } });
  if (!student || student.groupId !== groupId) return fail("Unauthorized.");

  await prisma.weeklyEntry.upsert({
    where: { groupId_weekNumber: { groupId, weekNumber } },
    create: {
      groupId,
      weekNumber,
      summary,
      submissionDate: summary ? new Date() : null,
      submittedById: student.id,
    },
    update: {
      summary,
      submissionDate: summary ? new Date() : null,
      submittedById: student.id,
    },
  });

  await log("weekly_summary_saved", "group", groupId, `W${weekNumber}`);
  revalidateGroup(groupId);
  return ok(`Week ${weekNumber} summary saved.`);
}

export async function evaluateWeekly(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "faculty" && session?.user?.role !== "admin") {
    return fail("Unauthorized.");
  }

  const groupId = Number(formData.get("groupId"));
  const weekNumber = Number(formData.get("weekNumber"));
  const performance = String(formData.get("performance") || "");
  if (!["satisfactory", "unsatisfactory", ""].includes(performance)) {
    return fail("Invalid performance.");
  }
  if (!performance) return fail("Select a performance rating.");

  if (session.user.role === "faculty") {
    const mentorship = await prisma.groupMentor.findFirst({
      where: { groupId, facultyId: Number(session.user.id) },
    });
    if (!mentorship) return fail("Not your mentored group.");
  }

  await prisma.weeklyEntry.upsert({
    where: { groupId_weekNumber: { groupId, weekNumber } },
    create: {
      groupId,
      weekNumber,
      summary: "",
      performance: performance || null,
      evaluationDate: performance ? new Date() : null,
      evaluatedById: session.user.role === "faculty" ? Number(session.user.id) : null,
    },
    update: {
      performance: performance || null,
      evaluationDate: performance ? new Date() : null,
      evaluatedById: session.user.role === "faculty" ? Number(session.user.id) : null,
    },
  });

  await log("weekly_evaluated", "group", groupId, `W${weekNumber}:${performance}`);
  revalidateGroup(groupId);
  return ok(`Week ${weekNumber} evaluation saved.`);
}

export async function saveRubricStatus(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "faculty" && session?.user?.role !== "admin") {
    return fail("Unauthorized.");
  }

  const groupId = Number(formData.get("groupId"));
  const rubricCode = String(formData.get("rubricCode") || "");
  const examinerName = String(formData.get("examinerName") || "").trim() || null;
  const status = String(formData.get("status") || "not_completed");
  if (!isRubricCode(rubricCode)) return fail("Invalid rubric.");

  const locked = await assertRubricTimelineOpen(groupId, rubricCode, session.user.role);
  if (locked) return locked;

  if (session.user.role === "faculty") {
    const mentorship = await prisma.groupMentor.findFirst({
      where: { groupId, facultyId: Number(session.user.id) },
    });
    if (!mentorship) return fail("Not your mentored group.");
  }

  await prisma.rubricGroupStatus.upsert({
    where: { groupId_rubricCode: { groupId, rubricCode } },
    create: {
      groupId,
      rubricCode,
      examinerName,
      status: status === "completed" ? "completed" : "not_completed",
      evaluationDate: status === "completed" ? new Date() : null,
    },
    update: {
      examinerName,
      status: status === "completed" ? "completed" : "not_completed",
      evaluationDate: status === "completed" ? new Date() : null,
    },
  });

  await log("rubric_status_saved", "group", groupId, rubricCode);
  revalidateGroup(groupId);
  return ok(`${rubricCode} status saved.`);
}

export async function saveRubricMarks(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "faculty" && session?.user?.role !== "admin") {
    return fail("Unauthorized.");
  }

  const groupId = Number(formData.get("groupId"));
  const rubricCode = String(formData.get("rubricCode") || "");
  if (!isRubricCode(rubricCode)) return fail("Invalid rubric.");

  const locked = await assertRubricTimelineOpen(groupId, rubricCode, session.user.role);
  if (locked) return locked;

  if (session.user.role === "faculty") {
    const mentorship = await prisma.groupMentor.findFirst({
      where: { groupId, facultyId: Number(session.user.id) },
    });
    if (!mentorship) return fail("Not your mentored group.");
  }

  const group = await prisma.projectGroup.findUnique({
    where: { id: groupId },
    include: { students: true },
  });
  if (!group) return fail("Group not found.");

  const maxMarks = RUBRICS[rubricCode].maxMarks;
  let saved = 0;
  for (const student of group.students) {
    const raw = formData.get(`marks_${student.id}`);
    if (raw === null || raw === "") continue;
    const marks = Math.max(0, Math.min(maxMarks, Number(raw)));
    await prisma.rubricStudentMark.upsert({
      where: {
        groupId_rubricCode_studentId: { groupId, rubricCode, studentId: student.id },
      },
      create: {
        groupId,
        rubricCode,
        studentId: student.id,
        marks,
        maxMarks,
        facultyId: session.user.role === "faculty" ? Number(session.user.id) : null,
      },
      update: {
        marks,
        maxMarks,
        facultyId: session.user.role === "faculty" ? Number(session.user.id) : null,
      },
    });
    saved++;
  }

  if (saved === 0) return fail("Enter at least one mark to save.");

  await log("rubric_marks_saved", "group", groupId, rubricCode);
  revalidateGroup(groupId);
  return ok(`${rubricCode} scores saved for ${saved} student(s).`);
}

export async function assignMentor(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "admin") return; // "Unauthorized"

  const groupId = Number(formData.get("groupId"));
  const facultyId = Number(formData.get("facultyId"));
  if (!groupId) return; // "Group required."

  await prisma.groupMentor.deleteMany({ where: { groupId } });
  if (facultyId) {
    await prisma.groupMentor.create({
      data: {
        groupId,
        facultyId,
        assignedBy: Number(session.user.id),
        isPrimary: true,
      },
    });
  }

  await log("mentor_assigned", "group", groupId, String(facultyId || "none"));
  revalidateGroup(groupId);
}

export async function saveRubricDeadlines(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") return fail("Unauthorized.");

  const batchId = Number(formData.get("batchId"));
  if (!batchId) return fail("Batch required.");

  let saved = 0;
  for (const code of Object.keys(RUBRICS)) {
    const openRaw = String(formData.get(`open_${code}`) || "").trim();
    const dueRaw = String(formData.get(`due_${code}`) || "").trim();
    if (!openRaw && !dueRaw) continue;
    if (!openRaw || !dueRaw) {
      return fail(`${code}: set both open and due date/time.`);
    }
    const openAt = new Date(openRaw);
    const dueAt = new Date(dueRaw);
    if (Number.isNaN(openAt.getTime()) || Number.isNaN(dueAt.getTime())) {
      return fail(`${code}: invalid date/time.`);
    }
    if (dueAt.getTime() < openAt.getTime()) {
      return fail(`${code}: due must be on or after open.`);
    }
    await prisma.rubricDeadline.upsert({
      where: { batchId_rubricCode: { batchId, rubricCode: code } },
      create: { batchId, rubricCode: code, openAt, dueAt },
      update: { openAt, dueAt },
    });
    saved++;
  }

  if (saved === 0) return fail("Set at least one rubric window.");

  await log("deadlines_saved", "batch", batchId, `saved=${saved}`);
  revalidatePath("/admin/dates");
  revalidatePath("/admin/rubrics");
  revalidatePath("/faculty/rubrics");
  revalidatePath("/student/rubrics");
  return ok(`Saved timeline for ${saved} rubric(s).`);
}

/** Students/faculty may only touch unlocked rubrics; admin always allowed. */
async function assertRubricTimelineOpen(
  groupId: number,
  rubricCode: string,
  role: string,
): Promise<ActionResult | null> {
  if (role === "admin") return null;
  const group = await prisma.projectGroup.findUnique({
    where: { id: groupId },
    include: { batch: { include: { rubricDeadlines: true } } },
  });
  if (!group) return fail("Group not found.");
  const schedule = group.batch.rubricDeadlines.find((d) => d.rubricCode === rubricCode);
  if (!schedule || !isRubricUnlocked(schedule.openAt)) {
    return fail(`${rubricCode} is not open on the project timeline yet.`);
  }
  return null;
}

export async function adminCreateStudent(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") return fail("Unauthorized.");

  const uniqueId = String(formData.get("uniqueId") || "").trim();
  const fullName = String(formData.get("fullName") || "").trim();
  const password = String(formData.get("password") || "password123");
  const batchId = Number(formData.get("batchId"));

  if (!isAktuRoll(uniqueId)) return fail("AKTU roll must be 10–20 digits.");
  if (!fullName || !batchId) return fail("Name and batch are required.");

  const exists = await prisma.student.findUnique({ where: { uniqueId } });
  if (exists) return fail("A student with this roll already exists.");

  await prisma.student.create({
    data: {
      uniqueId,
      fullName,
      passwordHash: await bcrypt.hash(password, 10),
      batchId,
      biodataComplete: false,
    },
  });

  await log("student_created", "student", undefined, uniqueId);
  revalidatePath("/admin");
  revalidatePath("/admin/students");
  return ok(`Student ${uniqueId} created.`);
}

export async function adminCreateFaculty(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") return fail("Unauthorized.");

  const uniqueId = String(formData.get("uniqueId") || "").trim();
  const fullName = String(formData.get("fullName") || "").trim();
  const password = String(formData.get("password") || "password123");
  const department = String(formData.get("department") || "CSE").trim();

  if (!uniqueId || !fullName) return fail("Unique Id and name are required.");

  const exists = await prisma.faculty.findUnique({ where: { uniqueId } });
  if (exists) return fail("Faculty Unique Id already exists.");

  await prisma.faculty.create({
    data: {
      uniqueId,
      fullName,
      department,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  await log("faculty_created", "faculty", undefined, uniqueId);
  revalidatePath("/admin");
  revalidatePath("/admin/faculty");
  return ok(`Faculty ${uniqueId} created.`);
}

export async function bulkImportStudents(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") return fail("Unauthorized.");

  const batchId = Number(formData.get("batchId"));
  const csvText = String(formData.get("csvText") || "").trim();
  const file = formData.get("csvFile");

  let raw = csvText;
  if (!raw && file instanceof File && file.size > 0) {
    raw = await file.text();
  }
  if (!batchId) return fail("Select a batch.");
  if (!raw) return fail("Paste CSV text or upload a .csv file.");

  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) return fail("Batch not found.");

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return fail("CSV is empty.");

  const start = /uniqueid|roll|aktu/i.test(lines[0]) ? 1 : 0;
  const defaultPassword = String(formData.get("defaultPassword") || "password123");
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = start; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const uniqueId = cols[0] || "";
    const fullName = cols[1] || "";
    const email = cols[2] || null;
    const phone = cols[3] || null;

    if (!uniqueId && !fullName) continue;
    if (!isAktuRoll(uniqueId)) {
      errors.push(`Row ${i + 1}: invalid roll "${uniqueId}"`);
      skipped++;
      continue;
    }
    if (!fullName) {
      errors.push(`Row ${i + 1}: missing name`);
      skipped++;
      continue;
    }

    const exists = await prisma.student.findUnique({ where: { uniqueId } });
    if (exists) {
      skipped++;
      continue;
    }

    await prisma.student.create({
      data: {
        uniqueId,
        fullName,
        email,
        phone,
        passwordHash,
        batchId,
        biodataComplete: false,
      },
    });
    created++;
  }

  await log("students_bulk_import", "batch", batchId, `created=${created};skipped=${skipped}`);
  revalidatePath("/admin/students");
  revalidatePath("/admin/import");

  if (created === 0 && errors.length) {
    return fail(`No students imported. ${errors.slice(0, 3).join(" · ")}`);
  }

  const extra = errors.length ? ` Issues: ${errors.slice(0, 3).join(" · ")}` : "";
  return ok(`Imported ${created} student(s). Skipped ${skipped}.${extra}`);
}

const UPLOAD_MAX_BYTES = 8 * 1024 * 1024;
const UPLOAD_MIME = new Set([
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
]);

export async function uploadRubricFile(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized.");

  const groupId = Number(formData.get("groupId"));
  const rubricCode = String(formData.get("rubricCode") || "");
  const kind = String(formData.get("kind") || ""); // slides | report
  const file = formData.get("file");

  if (!groupId || !isRubricCode(rubricCode)) return fail("Invalid group or rubric.");
  if (kind !== "slides" && kind !== "report") return fail("Invalid file type.");
  if (!RUBRICS[rubricCode].needsFiles) return fail("This rubric does not accept file uploads.");
  if (!(file instanceof File) || file.size === 0) return fail("Choose a file to upload.");
  if (file.size > UPLOAD_MAX_BYTES) return fail("File too large (max 8 MB).");
  if (file.type && !UPLOAD_MIME.has(file.type)) {
    return fail("Allowed: PDF, PPT/PPTX, DOC/DOCX, PNG, JPG.");
  }

  const locked = await assertRubricTimelineOpen(groupId, rubricCode, session.user.role);
  if (locked) return locked;

  const allowed = await canAccessGroup(session.user.role, Number(session.user.id), groupId);
  if (!allowed) return fail("Unauthorized for this group.");

  if (session.user.role === "student") {
    const student = await prisma.student.findUnique({ where: { id: Number(session.user.id) } });
    if (!student || student.groupId !== groupId) return fail("Unauthorized.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const dir = path.join(process.cwd(), "public", "uploads", "groups", String(groupId), rubricCode);
  await mkdir(dir, { recursive: true });
  const filename = `${kind}-${Date.now()}-${safeName}`;
  const abs = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(abs, buffer);
  const publicPath = `/uploads/groups/${groupId}/${rubricCode}/${filename}`;

  const existing = await prisma.rubricGroupStatus.findUnique({
    where: { groupId_rubricCode: { groupId, rubricCode } },
  });

  const oldPath = kind === "slides" ? existing?.slidesPath : existing?.reportPath;
  if (oldPath?.startsWith("/uploads/")) {
    try {
      await unlink(path.join(process.cwd(), "public", oldPath.replace(/^\//, "")));
    } catch {
      /* ignore missing old file */
    }
  }

  await prisma.rubricGroupStatus.upsert({
    where: { groupId_rubricCode: { groupId, rubricCode } },
    create: {
      groupId,
      rubricCode,
      status: "not_completed",
      slidesPath: kind === "slides" ? publicPath : null,
      reportPath: kind === "report" ? publicPath : null,
    },
    update: kind === "slides" ? { slidesPath: publicPath } : { reportPath: publicPath },
  });

  await log("rubric_file_uploaded", "group", groupId, `${rubricCode}:${kind}`);
  revalidateGroup(groupId);
  return ok(`${kind === "slides" ? "Slides" : "Report"} uploaded for ${rubricCode}.`);
}

export async function deleteRubricFile(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized.");

  const groupId = Number(formData.get("groupId"));
  const rubricCode = String(formData.get("rubricCode") || "");
  const kind = String(formData.get("kind") || "");
  if (!groupId || !isRubricCode(rubricCode) || (kind !== "slides" && kind !== "report")) {
    return fail("Invalid request.");
  }

  const locked = await assertRubricTimelineOpen(groupId, rubricCode, session.user.role);
  if (locked) return locked;

  const allowed = await canAccessGroup(session.user.role, Number(session.user.id), groupId);
  if (!allowed) return fail("Unauthorized.");
  if (session.user.role === "student") {
    const student = await prisma.student.findUnique({ where: { id: Number(session.user.id) } });
    if (!student?.isLeader && student?.groupId !== groupId) return fail("Unauthorized.");
  }

  const row = await prisma.rubricGroupStatus.findUnique({
    where: { groupId_rubricCode: { groupId, rubricCode } },
  });
  const filePath = kind === "slides" ? row?.slidesPath : row?.reportPath;
  if (filePath?.startsWith("/uploads/")) {
    try {
      await unlink(path.join(process.cwd(), "public", filePath.replace(/^\//, "")));
    } catch {
      /* ignore */
    }
  }

  if (row) {
    await prisma.rubricGroupStatus.update({
      where: { id: row.id },
      data: kind === "slides" ? { slidesPath: null } : { reportPath: null },
    });
  }

  await log("rubric_file_deleted", "group", groupId, `${rubricCode}:${kind}`);
  revalidateGroup(groupId);
  return ok("File removed.");
}

export async function changePassword(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized.");

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (newPassword.length < 6) return fail("New password must be at least 6 characters.");
  if (newPassword !== confirmPassword) return fail("New password and confirmation do not match.");

  const id = Number(session.user.id);
  const role = session.user.role;
  const hash = await bcrypt.hash(newPassword, 10);

  if (role === "admin") {
    const row = await prisma.admin.findUnique({ where: { id } });
    if (!row || !(await bcrypt.compare(currentPassword, row.passwordHash))) {
      return fail("Current password is incorrect.");
    }
    await prisma.admin.update({ where: { id }, data: { passwordHash: hash } });
  } else if (role === "faculty") {
    const row = await prisma.faculty.findUnique({ where: { id } });
    if (!row || !(await bcrypt.compare(currentPassword, row.passwordHash))) {
      return fail("Current password is incorrect.");
    }
    await prisma.faculty.update({ where: { id }, data: { passwordHash: hash } });
  } else {
    const row = await prisma.student.findUnique({ where: { id } });
    if (!row || !(await bcrypt.compare(currentPassword, row.passwordHash))) {
      return fail("Current password is incorrect.");
    }
    await prisma.student.update({ where: { id }, data: { passwordHash: hash } });
  }

  await log("password_changed", role, id);
  return ok("Password updated successfully.");
}

export async function forgotPassword(formData: FormData): Promise<ActionResult> {
  const uniqueId = String(formData.get("uniqueId") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!uniqueId || !email) return fail("Unique Id and registered email are required.");
  if (newPassword.length < 6) return fail("New password must be at least 6 characters.");
  if (newPassword !== confirmPassword) return fail("Passwords do not match.");

  const hash = await bcrypt.hash(newPassword, 10);

  const admin = await prisma.admin.findUnique({ where: { uniqueId } });
  if (admin) {
    if (!admin.email || admin.email.toLowerCase() !== email) {
      return fail("Email does not match our records for this Unique Id.");
    }
    await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash: hash } });
    await log("password_reset_forgot", "admin", admin.id, uniqueId);
    return ok("Password reset. You can log in now.", "/");
  }

  const faculty = await prisma.faculty.findUnique({ where: { uniqueId } });
  if (faculty) {
    if (!faculty.email || faculty.email.toLowerCase() !== email) {
      return fail("Email does not match our records for this Unique Id.");
    }
    await prisma.faculty.update({ where: { id: faculty.id }, data: { passwordHash: hash } });
    await log("password_reset_forgot", "faculty", faculty.id, uniqueId);
    return ok("Password reset. You can log in now.", "/");
  }

  const student = await prisma.student.findUnique({ where: { uniqueId } });
  if (student) {
    if (!student.email || student.email.toLowerCase() !== email) {
      return fail("Email does not match our records for this Unique Id.");
    }
    await prisma.student.update({ where: { id: student.id }, data: { passwordHash: hash } });
    await log("password_reset_forgot", "student", student.id, uniqueId);
    return ok("Password reset. You can log in now.", "/");
  }

  return fail("No account found for that Unique Id.");
}

export async function adminResetPassword(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") return fail("Unauthorized.");

  const role = String(formData.get("role") || "");
  const targetId = Number(formData.get("targetId"));
  const newPassword = String(formData.get("newPassword") || "password123");
  if (!targetId || newPassword.length < 6) return fail("Invalid reset request.");

  const hash = await bcrypt.hash(newPassword, 10);
  if (role === "student") {
    await prisma.student.update({ where: { id: targetId }, data: { passwordHash: hash } });
  } else if (role === "faculty") {
    await prisma.faculty.update({ where: { id: targetId }, data: { passwordHash: hash } });
  } else {
    return fail("Invalid role.");
  }

  await log("password_reset_admin", role, targetId);
  return ok(`Password reset to the value you entered.`);
}

export async function deleteGroup(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "admin") return;
  const groupId = Number(formData.get("groupId"));
  if (!groupId) return;

  await prisma.student.updateMany({ where: { groupId }, data: { groupId: null, isLeader: false } });
  await prisma.projectGroup.delete({ where: { id: groupId } });
  await log("group_deleted", "group", groupId);
  revalidatePath("/admin/groups");
  redirect("/admin/groups");
}

async function canAccessGroup(role: string, userId: number, groupId: number) {
  if (role === "admin") return true;
  if (role === "faculty") {
    return Boolean(
      await prisma.groupMentor.findFirst({ where: { groupId, facultyId: userId } }),
    );
  }
  if (role === "student") {
    const s = await prisma.student.findUnique({ where: { id: userId } });
    return s?.groupId === groupId;
  }
  return false;
}
