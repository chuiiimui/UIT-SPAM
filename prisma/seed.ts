import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.progressUpdate.deleteMany();
  await prisma.project.deleteMany();
  await prisma.groupMentor.deleteMany();
  await prisma.student.deleteMany();
  await prisma.projectGroup.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.admin.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.admin.create({
    data: {
      username: "principal",
      passwordHash,
      fullName: "Dr. Asha Mehra",
      email: "principal@uit.edu",
    },
  });

  const [f1, f2, f3] = await Promise.all([
    prisma.faculty.create({
      data: {
        facultyId: "FAC001",
        username: "faculty1",
        passwordHash,
        fullName: "Prof. Rajesh Kumar",
        email: "rajesh@uit.edu",
        department: "Computer Science",
        designation: "Associate Professor",
      },
    }),
    prisma.faculty.create({
      data: {
        facultyId: "FAC002",
        username: "faculty2",
        passwordHash,
        fullName: "Prof. Priya Sharma",
        email: "priya@uit.edu",
        department: "Information Technology",
        designation: "Assistant Professor",
      },
    }),
    prisma.faculty.create({
      data: {
        facultyId: "FAC003",
        username: "faculty3",
        passwordHash,
        fullName: "Prof. Amit Verma",
        email: "amit@uit.edu",
        department: "Computer Science",
        designation: "Professor",
      },
    }),
  ]);

  const [g1, g2, g3] = await Promise.all([
    prisma.projectGroup.create({
      data: {
        groupCode: "GRP-2026-001",
        groupName: "CodeCrafters",
        academicYear: "2025-26",
        semester: "VIII",
        department: "Computer Science",
        status: "active",
        isTemporary: false,
      },
    }),
    prisma.projectGroup.create({
      data: {
        groupCode: "GRP-2026-002",
        groupName: "DataNest",
        academicYear: "2025-26",
        semester: "VIII",
        department: "Information Technology",
        status: "active",
        isTemporary: false,
      },
    }),
    prisma.projectGroup.create({
      data: {
        groupCode: "GRP-2026-003",
        groupName: "NovaLabs",
        academicYear: "2025-26",
        semester: "VIII",
        department: "Computer Science",
        status: "pending",
        isTemporary: true,
      },
    }),
  ]);

  const students = await Promise.all([
    prisma.student.create({
      data: {
        studentId: "STU001",
        username: "stu_lead1",
        passwordHash,
        fullName: "Ananya Gupta",
        email: "ananya@student.uit.edu",
        department: "Computer Science",
        enrollmentNo: "ENR21001",
        groupId: g1.id,
        isLeader: true,
      },
    }),
    prisma.student.create({
      data: {
        studentId: "STU002",
        username: "stu_mem1",
        passwordHash,
        fullName: "Rohan Patel",
        email: "rohan@student.uit.edu",
        department: "Computer Science",
        enrollmentNo: "ENR21002",
        groupId: g1.id,
      },
    }),
    prisma.student.create({
      data: {
        studentId: "STU003",
        username: "stu_mem2",
        passwordHash,
        fullName: "Sneha Iyer",
        email: "sneha@student.uit.edu",
        department: "Computer Science",
        enrollmentNo: "ENR21003",
        groupId: g1.id,
      },
    }),
    prisma.student.create({
      data: {
        studentId: "STU004",
        username: "stu_lead2",
        passwordHash,
        fullName: "Kabir Singh",
        email: "kabir@student.uit.edu",
        department: "Information Technology",
        enrollmentNo: "ENR21011",
        groupId: g2.id,
        isLeader: true,
      },
    }),
    prisma.student.create({
      data: {
        studentId: "STU005",
        username: "stu_mem3",
        passwordHash,
        fullName: "Meera Joshi",
        email: "meera@student.uit.edu",
        department: "Information Technology",
        enrollmentNo: "ENR21012",
        groupId: g2.id,
      },
    }),
    prisma.student.create({
      data: {
        studentId: "STU006",
        username: "stu_lead3",
        passwordHash,
        fullName: "Arjun Nair",
        email: "arjun@student.uit.edu",
        department: "Computer Science",
        enrollmentNo: "ENR21021",
        groupId: g3.id,
        isLeader: true,
      },
    }),
    prisma.student.create({
      data: {
        studentId: "STU007",
        username: "stu_mem4",
        passwordHash,
        fullName: "Diya Kapoor",
        email: "diya@student.uit.edu",
        department: "Computer Science",
        enrollmentNo: "ENR21022",
        groupId: g3.id,
      },
    }),
  ]);

  await prisma.groupMentor.createMany({
    data: [
      { groupId: g1.id, facultyId: f1.id, assignedBy: admin.id, isPrimary: true },
      { groupId: g2.id, facultyId: f2.id, assignedBy: admin.id, isPrimary: true },
      { groupId: g2.id, facultyId: f1.id, assignedBy: admin.id, isPrimary: false },
    ],
  });

  const [p1, p2] = await Promise.all([
    prisma.project.create({
      data: {
        groupId: g1.id,
        title: "AI-Powered Campus Attendance System",
        abstract:
          "A facial recognition based attendance system integrated with college ERP.",
        domain: "Artificial Intelligence",
        techStack: "Python, OpenCV, Flutter, Firebase",
        objectives: "Automate attendance; reduce proxy; real-time dashboards for faculty.",
        status: "under_review",
        submittedAt: new Date(),
      },
    }),
    prisma.project.create({
      data: {
        groupId: g2.id,
        title: "Smart Library Resource Predictor",
        abstract: "ML model to predict book demand and optimize library inventory.",
        domain: "Machine Learning",
        techStack: "Python, scikit-learn, React, MySQL",
        objectives: "Forecast demand; recommend purchases; student wait-list insights.",
        status: "approved",
        submittedAt: new Date(),
      },
    }),
  ]);

  await prisma.progressUpdate.createMany({
    data: [
      {
        projectId: p1.id,
        studentId: students[0].id,
        milestone: "proposal",
        title: "Proposal submitted",
        description: "Initial proposal with literature survey.",
        percentage: 20,
      },
      {
        projectId: p1.id,
        studentId: students[1].id,
        milestone: "srs",
        title: "SRS draft v1",
        description: "Use cases and functional requirements documented.",
        percentage: 40,
      },
      {
        projectId: p2.id,
        studentId: students[3].id,
        milestone: "design",
        title: "Architecture complete",
        description: "System design and ER diagrams finalized.",
        percentage: 55,
      },
      {
        projectId: p2.id,
        studentId: students[4].id,
        milestone: "prototype",
        title: "MVP demo ready",
        description: "Core prediction pipeline working on sample data.",
        percentage: 70,
      },
    ],
  });

  await prisma.assessment.createMany({
    data: [
      {
        groupId: g1.id,
        facultyId: f1.id,
        studentId: students[0].id,
        milestone: "proposal",
        marks: 8.5,
        contributionNote: "Strong problem statement and clear scope.",
      },
      {
        groupId: g1.id,
        facultyId: f1.id,
        studentId: students[1].id,
        milestone: "srs",
        marks: 7,
        contributionNote: "Good documentation; needs tighter non-functional reqs.",
      },
      {
        groupId: g1.id,
        facultyId: f1.id,
        milestone: "proposal",
        marks: 8,
        contributionNote: "Group proposal accepted with minor revisions.",
      },
      {
        groupId: g2.id,
        facultyId: f2.id,
        studentId: students[3].id,
        milestone: "design",
        marks: 9,
        contributionNote: "Excellent architecture and modularity.",
      },
      {
        groupId: g2.id,
        facultyId: f2.id,
        studentId: students[4].id,
        milestone: "prototype",
        marks: 8.5,
        contributionNote: "Solid MVP; improve error handling.",
      },
    ],
  });

  await prisma.comment.createMany({
    data: [
      {
        groupId: g1.id,
        facultyId: f1.id,
        body: "Please refine the dataset collection plan before next review.",
      },
      {
        groupId: g1.id,
        facultyId: f1.id,
        studentId: students[1].id,
        body: "Add sequence diagrams for the attendance flow.",
      },
      {
        groupId: g2.id,
        facultyId: f2.id,
        body: "Great pace. Schedule mid-term demo next week.",
      },
    ],
  });

  await prisma.milestoneDeadline.createMany({
    data: [
      {
        milestone: "proposal",
        title: "Proposal submission deadline",
        dueAt: new Date("2026-08-15T23:59:00"),
        description: "Upload proposal PDF to the submission vault.",
        createdById: admin.id,
      },
      {
        milestone: "final",
        title: "Final report deadline",
        dueAt: new Date("2026-11-30T23:59:00"),
        description: "Final report + demo pack due.",
        createdById: admin.id,
      },
    ],
  });

  await prisma.announcement.create({
    data: {
      title: "Welcome to UIT - SPAM",
      body: "Use portals for project work, mentoring, and assessment. Check deadlines regularly.",
      audience: "all",
      createdById: admin.id,
    },
  });

  await prisma.rubric.create({
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
  });

  await prisma.contributionLog.create({
    data: {
      groupId: g1.id,
      studentId: students[0].id,
      weekLabel: "Week 4",
      title: "Dataset collection pipeline",
      description: "Built scripts to collect sample campus imagery.",
      hours: 6,
      evidence: "github.com/codecrafters/attendance",
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        role: "student",
        userId: students[0].id,
        title: "Welcome",
        body: "Your group GRP-2026-001 is active. Upload your proposal when ready.",
        href: "/student/submissions",
      },
      {
        role: "faculty",
        userId: f1.id,
        title: "Mentorship ready",
        body: "You are mentoring GRP-2026-001 and co-mentoring GRP-2026-002.",
        href: "/faculty/review",
      },
      {
        role: "admin",
        userId: admin.id,
        title: "System seeded",
        body: "Demo data loaded for UIT - SPAM.",
        href: "/admin",
      },
    ],
  });

  await prisma.policySetting.createMany({
    data: [
      { key: "late_submissions", value: "yes" },
      { key: "peer_ratings_required", value: "no" },
    ],
  });

  console.log("Seeded UIT - SPAM demo data.");
  console.log("Password for all accounts: password123");
  void f3;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
