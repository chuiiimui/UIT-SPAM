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
    const biodataComplete = n < 50; // 050–100 start without biodata
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

  /** 10 premade active groups (3 members each) with UIT-MAP mentors */
  const PREMADE_GROUPS = [
    {
      title: "Smart Campus Attendance using Computer Vision",
      about:
        "A camera-based attendance system that detects and recognizes student faces in classrooms, marks attendance automatically, and generates reports for faculty.",
      domain: "Computer Vision / Campus automation",
      objectives:
        "Reduce manual attendance time\nImprove accuracy of daily records\nProvide exportable attendance reports for mentors",
      techStack: "Python, OpenCV, Face recognition, Next.js, SQLite",
      mentorName: "Dr. Amit Kumar Tiwari",
    },
    {
      title: "AI Study Companion for Engineering Students",
      about:
        "An AI helper that answers syllabus-oriented questions, suggests study plans, and tracks weekly learning goals for final-year engineering students.",
      domain: "EdTech / Generative AI",
      objectives:
        "Personalize revision plans\nAnswer subject FAQs with citations\nTrack weekly study progress",
      techStack: "Next.js, Python, LLMs, Vector search",
      mentorName: "Mrs. Shruti Srivastava",
    },
    {
      title: "IoT-Based Smart Lab Equipment Tracker",
      about:
        "Track lab instruments with RFID/IoT tags, log check-in/out, and alert faculty when equipment is overdue.",
      domain: "IoT / Campus operations",
      objectives: "Reduce equipment loss\nAutomate lab inventory\nNotify supervisors of misuse",
      techStack: "ESP32, MQTT, Node.js, React",
      mentorName: "Mr. Shashank Dwivedi",
    },
    {
      title: "Campus Placement Portal with Resume Analytics",
      about:
        "A placement desk for companies and students with resume scoring hints and interview scheduling.",
      domain: "Web apps / HR tech",
      objectives: "Centralize job drives\nHelp students improve resumes\nSimplify company shortlisting",
      techStack: "Next.js, Prisma, NLP scoring",
      mentorName: "Dr. Abhishek Malviya",
    },
    {
      title: "Mental Wellness Chat Support for Students",
      about:
        "Anonymous wellness check-ins and guided resources with optional counselor escalation for campus students.",
      domain: "HealthTech / NLP",
      objectives: "Lower barrier to seek help\nProvide daily mood tracking\nRoute urgent cases to counselors",
      techStack: "Flutter, Firebase, LLM moderation",
      mentorName: "Dr. Anubhav Kumar Prasad",
    },
    {
      title: "Smart Waste Segregation Monitor for Hostel Blocks",
      about:
        "Sensors and a dashboard that monitor waste bins and encourage proper segregation in hostels.",
      domain: "IoT / Sustainability",
      objectives: "Improve segregation compliance\nAlert housekeeping\nPublish weekly green scores",
      techStack: "Arduino, LoRa, Grafana, Python",
      mentorName: "Dr. Umesh Pandey",
    },
    {
      title: "Peer Tutoring Marketplace for UIT Courses",
      about:
        "Match senior tutors with juniors by subject, schedule sessions, and collect feedback after each class.",
      domain: "EdTech / Marketplace",
      objectives: "Improve weak-subject outcomes\nReward peer tutors\nTrack session quality",
      techStack: "Next.js, PostgreSQL, Stripe demo",
      mentorName: "Mr. Anil Singh",
    },
    {
      title: "Offline-First Notes Sync for Low Connectivity",
      about:
        "A notes app that works offline in hostels and syncs when campus Wi-Fi returns, with conflict resolution.",
      domain: "Mobile / Sync systems",
      objectives: "Support offline study\nConflict-safe sync\nShare notes within a group",
      techStack: "React Native, SQLite, CRDTs",
      mentorName: "Mr. Ashish Dwivedi",
    },
    {
      title: "Exam Seating Arrangement Generator",
      about:
        "Generate clash-free exam seating charts from student rolls and room capacity with printable PDFs.",
      domain: "Campus admin tooling",
      objectives: "Cut manual seating effort\nAvoid roll clashes\nExport printable plans",
      techStack: "Python, FastAPI, ReportLab, React",
      mentorName: "Mr. Dhananjay Kumar Sharma",
    },
    {
      title: "Library Book Recommendation Engine",
      about:
        "Recommend library titles from issue history and syllabus keywords, with faculty-curated reading lists.",
      domain: "Recommender systems",
      objectives: "Increase library utilization\nPersonalize reading lists\nSupport faculty book banks",
      techStack: "Python, scikit-learn, Next.js",
      mentorName: "Mr. Rohit Mishra",
    },
  ] as const;

  const MEMBERS_PER_GROUP = 3;
  const needed = PREMADE_GROUPS.length * MEMBERS_PER_GROUP;
  if (students.length < needed) {
    throw new Error(`Need at least ${needed} biodata-complete students; found ${students.length}`);
  }

  let studentCursor = 0;
  const createdGroups: { id: number; groupCode: string; title: string; mentor: string }[] = [];

  for (let i = 0; i < PREMADE_GROUPS.length; i++) {
    const meta = PREMADE_GROUPS[i];
    const group = await prisma.projectGroup.create({
      data: {
        groupCode: `GRP-2027-${String(i + 1).padStart(3, "0")}`,
        projectTitle: meta.title,
        projectAbout: meta.about,
        domain: meta.domain,
        objectives: meta.objectives,
        techStack: meta.techStack,
        batchId: batch.id,
        status: "active",
      },
    });

    const members = students.slice(studentCursor, studentCursor + MEMBERS_PER_GROUP);
    studentCursor += MEMBERS_PER_GROUP;

    for (let m = 0; m < members.length; m++) {
      await prisma.student.update({
        where: { id: members[m].id },
        data: { groupId: group.id, isLeader: m === 0 },
      });
    }

    const mentor =
      faculty.find((f) => f.fullName === meta.mentorName) ?? faculty[i % faculty.length];
    await prisma.groupMentor.create({
      data: { groupId: group.id, facultyId: mentor.id, isPrimary: true },
    });

    for (let week = 1; week <= 8; week++) {
      await prisma.weeklyEntry.create({
        data: {
          groupId: group.id,
          weekNumber: week,
          summary:
            week === 1
              ? `Week 1 kickoff for ${meta.title}: repo setup, roles assigned, and initial research.`
              : "",
          performance: week === 1 ? "satisfactory" : null,
          submissionDate: week === 1 ? new Date() : null,
          submittedById: week === 1 ? members[0].id : null,
        },
      });
    }

    createdGroups.push({
      id: group.id,
      groupCode: group.groupCode,
      title: meta.title,
      mentor: mentor.fullName,
    });
  }

  const studentCount = await prisma.student.count();
  const facultyCount = await prisma.faculty.count();
  const groupCount = await prisma.projectGroup.count();
  const freeCount = await prisma.student.count({
    where: { biodataComplete: true, groupId: null },
  });

  console.log("Seeded UIT-SPAM (MAP-aligned)");
  console.log(`Faculty mentors: ${facultyCount} (copied from UIT-MAP)`);
  console.log(`Premade active groups: ${groupCount}`);
  for (const g of createdGroups) {
    console.log(`  ${g.groupCode} · ${g.mentor} · ${g.title}`);
  }
  console.log(`Students: ${studentCount} (${freeCount} free with biodata for invites)`);
  console.log("Admin: testadmin / 123456  OR  principal / password123");
  console.log("Faculty Unique Ids (password password123):");
  for (const f of MAP_FACULTY) {
    console.log(`  ${f.uniqueId}  →  ${f.fullName}`);
  }
  console.log("Students: 2102840100001 .. 2102840100100 / password123");
  console.log("Incomplete biodata: 2102840100050 .. 2102840100100 / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
