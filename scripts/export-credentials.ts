import "dotenv/config";
import { writeFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const root = path.join(__dirname, "..");

async function main() {
  const students = await prisma.student.findMany({
    include: { batch: true, group: true },
    orderBy: { uniqueId: "asc" },
  });
  const faculty = await prisma.faculty.findMany({
    include: { mentorships: { include: { group: true } } },
    orderBy: { fullName: "asc" },
  });

  const complete = students.filter((s) => s.biodataComplete);
  const incomplete = students.filter((s) => !s.biodataComplete);

  let studentDoc = `# UIT-SPAM — Student Login Credentials

Generated from the current database.

**Login URL:** http://localhost:3000  
**Password for all students:** \`password123\`

## Summary

| Status | Count |
|--------|------:|
| Biodata complete | ${complete.length} |
| Biodata incomplete | ${incomplete.length} |
| **Total students** | **${students.length}** |

---

## All students

| # | Unique Id (AKTU roll) | Name | Password | Biodata | Batch | Group |
|---|----------------------:|------|----------|---------|-------|-------|
`;

  students.forEach((st, i) => {
    studentDoc += `| ${i + 1} | \`${st.uniqueId}\` | ${st.fullName} | \`password123\` | ${
      st.biodataComplete ? "Complete" : "Incomplete"
    } | ${st.batch?.label ?? "—"} | ${st.group?.groupCode ?? "—"} |\n`;
  });

  studentDoc += `
---

## Biodata complete only

| # | Unique Id | Name | Group |
|---|----------:|------|-------|
`;
  complete.forEach((st, i) => {
    studentDoc += `| ${i + 1} | \`${st.uniqueId}\` | ${st.fullName} | ${st.group?.groupCode ?? "—"} |\n`;
  });

  studentDoc += `
---

## Biodata incomplete only

These accounts must finish biodata before creating or joining a group.

| # | Unique Id | Name |
|---|----------:|------|
`;
  incomplete.forEach((st, i) => {
    studentDoc += `| ${i + 1} | \`${st.uniqueId}\` | ${st.fullName} |\n`;
  });

  studentDoc += `
---

*Demo note: seed sets rolls \`2102840100050\`–\`2102840100100\` without biodata.*
`;

  let mentorDoc = `# UIT-SPAM — Mentor (Faculty) Login Credentials

Generated from the current database. Names match UIT-MAP mentors.

**Login URL:** http://localhost:3000  
**Password for all mentors:** \`password123\`

## Summary

| | Count |
|--|------:|
| **Total mentors** | **${faculty.length}** |
| Mentors with assigned groups | ${faculty.filter((f) => f.mentorships.length > 0).length} |

---

## All mentors

| # | Unique Id | Name | Password | Designation | Department | Email | Mentored groups |
|---|-----------|------|----------|-------------|------------|-------|-----------------|
`;

  faculty.forEach((fac, i) => {
    const groups =
      fac.mentorships.map((m) => m.group.groupCode).sort().join(", ") || "—";
    mentorDoc += `| ${i + 1} | \`${fac.uniqueId}\` | ${fac.fullName} | \`password123\` | ${
      fac.designation
    } | ${fac.department ?? "—"} | ${fac.email ?? "—"} | ${groups} |\n`;
  });

  mentorDoc += `
---

## Quick login examples

| Unique Id | Name |
|-----------|------|
| \`amit.kumar.tiwari\` | Dr. Amit Kumar Tiwari |
| \`shruti.srivastava\` | Mrs. Shruti Srivastava |
| \`shashank.dwivedi\` | Mr. Shashank Dwivedi |

Full faculty seed source: \`prisma/data/map-faculty.json\`
`;

  const studentPath = path.join(root, "STUDENT_CREDENTIALS.md");
  const mentorPath = path.join(root, "MENTOR_CREDENTIALS.md");
  writeFileSync(studentPath, studentDoc, "utf8");
  writeFileSync(mentorPath, mentorDoc, "utf8");
  console.log("Wrote", studentPath);
  console.log("Wrote", mentorPath);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
