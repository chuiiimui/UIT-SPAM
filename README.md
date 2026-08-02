# UIT - SPAM

**United Institute Of Technology — Student Project Assessment And Mentorship**

MAP-aligned campus portal for final-year projects: one Unique Id login, student biodata, groups by AKTU roll, invite/approve flow, weekly diary (1–8), and rubrics R1–R8 with an admin-controlled unlock timeline.

## Requirements

- Node.js 20+
- npm

## Setup

```bash
npm install
npm run db:reset
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Next.js (Turbopack) |
| `npm run db:reset` | Reset SQLite DB + seed demo data |
| `npm run db:push` | Apply schema without reseeding |
| `npm run db:seed` | Seed only |

## Demo logins

| Role | Unique Id | Password |
|------|-----------|----------|
| Admin | `testadmin` | `123456` |
| Admin (alt) | `principal` | `password123` |
| Faculty (16 from UIT-MAP) | e.g. `amit.kumar.tiwari`, `shruti.srivastava` | `password123` |
| Students | `2102840100001` … `2102840100100` | `password123` |
| Student (needs biodata) | `2102840100050` … `2102840100100` | `password123` |

- Full faculty list: [`prisma/data/map-faculty.json`](prisma/data/map-faculty.json) (names match UIT-MAP mentors).
- Faculty emails: `{uniqueId}@uit.ac.in` · Admin: `principal@uit.ac.in` · Students with biodata: `{roll}@student.uit.ac.in`
- Seed includes **10 premade active groups** (`GRP-2027-001` … `010`), 3 members each (rolls `…0001`–`…0030`), each with a UIT-MAP mentor.
- Remaining biodata-complete students (`…0031`–`…0049`) are free to invite; `…0050`–`…0100` must complete biodata first.

## Product flow

1. **Admin** registers students/faculty (or **CSV import** at `/admin/import`) and sets the **R1–R8 timeline** (open + due) at `/admin/dates`.
2. **Student** logs in → completes biodata → creates a group or accepts invites (AKTU roll search).
3. Invites require member approve/reject; leader submits (or auto-submits) → status `pending_admin`.
4. **Admin** approves the group and assigns a mentor on Groups.
5. On `/group/[id]`: weekly diary (1–8); project summary; links to Rubrics.
6. **Students & mentors** only see rubrics whose **Open** time has passed; **admin** sees all R1–R8.
7. R2 / R6: upload slides + report (active groups).
8. Admin downloads the marksheet from Marks.

## Features (current)

- Single login (`/`) — role from Unique Id  
- ActionResult validation banners on forms  
- Group invite search, member approve, admin approve  
- Project summary modal on the group page  
- Rubric timeline unlock (students/faculty); full catalog for admin  
- R2/R6 file uploads under `public/uploads/groups/`  
- Student biodata page for faculty/admin: `/students/[id]` (click any student name)  
- Password change (`/account/password`), forgot password (`/forgot-password`), admin reset  
- Bulk CSV student import  

## Key routes

| Who | Route | Purpose |
|-----|-------|---------|
| All | `/` | Login |
| All | `/forgot-password` | Reset via Unique Id + email |
| All | `/account/password` | Change password when logged in |
| All | `/guidelines` | Project guidelines |
| Student | `/student` | Biodata / create group / invites |
| Student | `/student/rubrics` | Open rubrics only |
| Faculty | `/faculty` | Mentored groups |
| Faculty | `/faculty/rubrics` | Score open rubrics |
| Shared | `/group/[id]` | Single group page (diary, members, summary) |
| Staff | `/students/[id]` | Student biodata (admin / mentoring faculty) |
| Admin | `/admin` | Control tiles |
| Admin | `/admin/groups` | Approve, assign mentors |
| Admin | `/admin/dates` | R1–R8 open/due timeline |
| Admin | `/admin/rubrics` | All rubrics + scoring |
| Admin | `/admin/marks` | Marksheet + CSV |
| Admin | `/admin/students` | Register / reset password |
| Admin | `/admin/import` | Bulk CSV students |
| Admin | `/admin/faculty` | Mentors / reset password |

## Stack

Next.js 16 · TypeScript · Prisma (SQLite) · Auth.js (NextAuth v5) · Tailwind CSS v4

## Docs

- [DOCUMENTATION.md](./DOCUMENTATION.md) — roles, data model, rubrics, file map  
- [STUDENT_CREDENTIALS.md](./STUDENT_CREDENTIALS.md) — all student Unique Ids + biodata status  
- [MENTOR_CREDENTIALS.md](./MENTOR_CREDENTIALS.md) — all mentor Unique Ids  

Regenerate credential lists after reseeding:

```bash
npx tsx scripts/export-credentials.ts
```
