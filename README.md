# UIT - SPAM

**United Institute Of Technology — Student Project Assessment And Mentorship**

MAP-aligned campus portal: one Unique Id login, student biodata, groups by AKTU roll, weekly diary (1–8), rubrics R1–R8 on a single group page.

## Setup

```bash
npm install
npm run db:reset
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo logins

Password for faculty/students: `password123`

| Role | Unique Id |
|------|-----------|
| Admin | `testadmin` / `123456` |
| Admin (alt) | `principal` / `password123` |
| Faculty (20) | `faculty1` … `faculty20` |
| Students (100) | `2102840100001` … `2102840100100` |
| Student (needs biodata) | `2102840100098` … `2102840100100` |

Seed includes 2 demo active groups; ~91 students with biodata are free to invite.

## Flow

1. Admin registers students/faculty (or **CSV import** at `/admin/import`) and sets R1–R8 dates  
2. Student completes biodata → creates/joins group with AKTU rolls (invite → member approve → admin approve)  
3. Admin assigns mentor on Groups  
4. Student fills weekly diary on `/group/[id]`; faculty/admin score R1–R8 on Rubrics  
5. R2/R6: upload slides + report on Rubrics (active groups)  
6. Admin downloads marksheet from Marks  

## Passwords

- Logged-in users: **Password** nav → `/account/password`  
- Forgot: `/forgot-password` (Unique Id + registered email)  
- Demo emails: student `roll@student.uit.ac.in`, faculty `facultyN@uit.ac.in`, admin `principal@uit.ac.in`  
- Admin can reset student/faculty passwords from Students / Faculty lists  

## Key paths

| Area | Path |
|------|------|
| Actions / validation | `src/lib/map/actions.ts`, `src/components/action-form.tsx` |
| Schema / seed | `prisma/schema.prisma`, `prisma/seed.ts` |
| Group page | `src/app/group/[id]/page.tsx` |
| Rubrics + uploads | `src/components/rubric-panel.tsx`, `src/components/rubric-files.tsx` |
| Uploads on disk | `public/uploads/groups/` (gitignored) |

## Stack

Next.js, TypeScript, Prisma (SQLite locally), NextAuth, Tailwind CSS
