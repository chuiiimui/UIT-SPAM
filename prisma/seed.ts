import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { RUBRIC_CODES } from "../src/lib/map/rubrics";

const prisma = new PrismaClient();

/** Exact mentor names from UIT-MAP groups mentor dropdown (scraped from uitmap.com). */
type MapFaculty = {
  uniqueId: string;
  fullName: string;
  designation: string;
  department: string;
};

const MAP_FACULTY: MapFaculty[] = JSON.parse(
  readFileSync(path.join(__dirname, "data", "map-faculty.json"), "utf8"),
);

const FIRST = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
  "Shaurya", "Atharv", "Advait", "Pranav", "Madhav", "Kabir", "Ansh", "Rudra", "Yash", "Dev",
  "Diya", "Ananya", "Aadhya", "Pari", "Anika", "Myra", "Sara", "Aarohi", "Anvi", "Kiara",
  "Saanvi", "Navya", "Ira", "Mishka", "Prisha", "Riya", "Isha", "Meera", "Neha", "Kavya",
  "Rohan", "Kunal", "Harsh", "Nikhil", "Rahul", "Aman", "Varun", "Siddharth", "Manav", "Tushar",
  "Pooja", "Shreya", "Tanvi", "Nisha", "Pallavi", "Sneha", "Aditi", "Sakshi", "Priya", "Simran",
];

const LAST = [
  "Sharma", "Verma", "Singh", "Gupta", "Patel", "Mishra", "Yadav", "Joshi", "Kapoor", "Agarwal",
  "Pandey", "Tiwari", "Srivastava", "Chauhan", "Rathore", "Malhotra", "Bansal", "Saxena", "Dubey", "Nair",
  "Reddy", "Iyer", "Khan", "Ali", "Das", "Roy", "Ghosh", "Bhatt", "Mehta", "Jain",
];

const BRANCHES = ["CSE", "CSE", "IT", "AI/ML", "CSE"] as const;
const SECTIONS = ["A", "B", "C", "D"] as const;

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length];
}

function studentName(i: number) {
  return `${pick(FIRST, i)} ${pick(LAST, i * 3 + 1)}`;
}

function phoneFor(i: number) {
  return `98${String(70000000 + i).padStart(8, "0")}`;
}

async function main() {
  await prisma.rubricStudentMark.deleteMany();
  await prisma.rubricGroupStatus.deleteMany();
  await prisma.rubricDeadline.deleteMany();
  await prisma.weeklyEntry.deleteMany();
  await prisma.groupInvite.deleteMany();
  await prisma.groupMentor.deleteMany();
  await prisma.student.deleteMany();
  await prisma.projectGroup.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.activityLog.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const batch = await prisma.batch.create({
    data: { label: "2023-2027", endYear: 2027, isActive: true },
  });

  const batchOld = await prisma.batch.create({
    data: { label: "2021-2025", endYear: 2025, isActive: true },
  });

  // Sequential 14-day windows: R1 open now; later rubrics unlock one after another
  const now = Date.now();
  const windowMs = 14 * 24 * 60 * 60 * 1000;
  for (let i = 0; i < RUBRIC_CODES.length; i++) {
    await prisma.rubricDeadline.create({
      data: {
        batchId: batch.id,
        rubricCode: RUBRIC_CODES[i],
        openAt: new Date(now + i * windowMs),
        dueAt: new Date(now + (i + 1) * windowMs - 1000),
      },
    });
  }

  await prisma.admin.create({
    data: {
      uniqueId: "testadmin",
      passwordHash: await bcrypt.hash("123456", 10),
      fullName: "Campus Principal",
      email: "principal@uit.ac.in",
    },
  });

  await prisma.admin.create({
    data: {
      uniqueId: "principal",
      passwordHash,
      fullName: "Demo Principal",
      email: "demo.principal@uit.ac.in",
    },
  });

  // Faculty mentors — exact names from UIT-MAP (16 mentors)
  const facultyRows = MAP_FACULTY.map((f, i) => ({
    uniqueId: f.uniqueId,
    passwordHash,
    fullName: f.fullName,
    department: f.department,
    designation: f.designation,
    email: `${f.uniqueId}@uit.ac.in`,
    phone: phoneFor(100 + i),
    isActive: true,
  }));

  await prisma.faculty.createMany({ data: facultyRows });
  const faculty = await prisma.faculty.findMany({ orderBy: { fullName: "asc" } });

  // 100 students — AKTU-style rolls 2102840100001 .. 2102840100100
  const studentRows = Array.from({ length: 100 }, (_, i) => {
    const n = i + 1;
    const uniqueId = `2102840100${String(n).padStart(3, "0")}`;
    const biodataComplete = n > 97 ? false : true; // last 3 need biodata
    const useOldBatch = n > 90 && n <= 97; // a few in older batch
    return {
      uniqueId,
      passwordHash,
      fullName: biodataComplete ? studentName(i) : `New Student ${n}`,
      email: biodataComplete ? `${uniqueId}@student.uit.ac.in` : null,
      phone: biodataComplete ? phoneFor(n) : null,
      department: biodataComplete ? "CSE" : null,
      branch: biodataComplete ? pick(BRANCHES, i) : null,
      section: biodataComplete ? pick(SECTIONS, i) : null,
      semester: biodataComplete ? "VII" : null,
      batchId: useOldBatch ? batchOld.id : batch.id,
      biodataComplete,
      isLeader: false,
      isActive: true,
    };
  });

  await prisma.student.createMany({ data: studentRows });
  const students = await prisma.student.findMany({
    where: { batchId: batch.id, biodataComplete: true },
    orderBy: { uniqueId: "asc" },
  });

  const g1 = await prisma.projectGroup.create({
    data: {
      groupCode: "GRP-2027-001",
      projectTitle: "Smart Campus Attendance using Computer Vision",
      projectAbout:
        "A camera-based attendance system that detects and recognizes student faces in classrooms, marks attendance automatically, and generates reports for faculty.",
      domain: "Computer Vision / Campus automation",
      objectives:
        "Reduce manual attendance time\nImprove accuracy of daily records\nProvide exportable attendance reports for mentors",
      techStack: "Python, OpenCV, Face recognition, Next.js, SQLite",
      batchId: batch.id,
      status: "active",
    },
  });

  const g2 = await prisma.projectGroup.create({
    data: {
      groupCode: "GRP-2027-002",
      projectTitle: "AI Study Companion for Engineering Students",
      projectAbout:
        "An AI helper that answers syllabus-oriented questions, suggests study plans, and tracks weekly learning goals for final-year engineering students.",
      domain: "EdTech / Generative AI",
      objectives:
        "Personalize revision plans\nAnswer subject FAQs with citations\nTrack weekly study progress",
      techStack: "Next.js, Python, LLMs, Vector search",
      batchId: batch.id,
      status: "active",
    },
  });

  // Put first 6 biodata-complete 2027-batch students into demo groups
  const demo = students.slice(0, 6);
  await prisma.student.update({
    where: { id: demo[0].id },
    data: { groupId: g1.id, isLeader: true },
  });
  await prisma.student.update({
    where: { id: demo[1].id },
    data: { groupId: g1.id, isLeader: false },
  });
  await prisma.student.update({
    where: { id: demo[2].id },
    data: { groupId: g1.id, isLeader: false },
  });
  await prisma.student.update({
    where: { id: demo[3].id },
    data: { groupId: g2.id, isLeader: true },
  });
  await prisma.student.update({
    where: { id: demo[4].id },
    data: { groupId: g2.id, isLeader: false },
  });
  await prisma.student.update({
    where: { id: demo[5].id },
    data: { groupId: g2.id, isLeader: false },
  });

  const f1 = faculty.find((f) => f.fullName === "Dr. Amit Kumar Tiwari")!;
  const f2 = faculty.find((f) => f.fullName === "Mrs. Shruti Srivastava")!;

  await prisma.groupMentor.create({
    data: { groupId: g1.id, facultyId: f1.id, isPrimary: true },
  });
  await prisma.groupMentor.create({
    data: { groupId: g2.id, facultyId: f2.id, isPrimary: true },
  });

  for (let week = 1; week <= 8; week++) {
    await prisma.weeklyEntry.create({
      data: {
        groupId: g1.id,
        weekNumber: week,
        summary: week === 1 ? "Setup repo, UI wireframes, and database schema." : "",
        performance: week === 1 ? "satisfactory" : null,
        submissionDate: week === 1 ? new Date() : null,
        submittedById: week === 1 ? demo[0].id : null,
      },
    });
  }

  const studentCount = await prisma.student.count();
  const facultyCount = await prisma.faculty.count();
  const freeCount = await prisma.student.count({
    where: { biodataComplete: true, groupId: null },
  });

  console.log("Seeded UIT-SPAM (MAP-aligned)");
  console.log(`Faculty mentors: ${facultyCount} (copied from UIT-MAP)`);
  console.log(`Students: ${studentCount} (${freeCount} free with biodata for invites)`);
  console.log("Admin: testadmin / 123456  OR  principal / password123");
  console.log("Faculty Unique Ids (password password123):");
  for (const f of MAP_FACULTY) {
    console.log(`  ${f.uniqueId}  →  ${f.fullName}`);
  }
  console.log("Students: 2102840100001 .. 2102840100100 / password123");
  console.log("Incomplete biodata: 2102840100098 .. 2102840100100 / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
