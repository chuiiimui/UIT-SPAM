# UIT - SPAM — Documentation

**United Institute Of Technology — Student Project Assessment And Mentorship**  
MAP-aligned final-year project portal: simple UI, Unique Id login, biodata, groups by AKTU roll, weekly diary, R1–R8 rubrics with an admin timeline.

Stack: **Next.js 16 · TypeScript · Prisma (SQLite) · Auth.js · Tailwind CSS v4**

---

## 1. Goals

| Principle | Meaning |
|-----------|---------|
| MAP-simple UI | Few main screens per role; one group page for day-to-day work |
| Stronger under the hood | Validation, audit log, secure auth, file uploads, CSV import |
| Campus-ready | AKTU rolls, batch years, mentor assignment, marksheet export |

Reference product: [uitmap.com](https://uitmap.com) (UIT-MAP).

---

## 2. Roles & screens

| Role | Unique Id | Main screens |
|------|-----------|----------------|
| **Student** | AKTU roll | `/student` (biodata / invites / create group) → `/group/[id]` → `/student/rubrics` |
| **Faculty** | Slug id (e.g. `amit.kumar.tiwari`) | `/faculty` → `/group/[id]` → `/faculty/rubrics` |
| **Admin** | e.g. `testadmin` | `/admin` tiles: Groups, Rubrics, Dates, Marks, Students, Import, Faculty, Guidelines |

Shared: `/guidelines`, `/account/password`, `/forgot-password`.  
Staff-only biodata view: `/students/[id]` (click student names in faculty/admin UIs).

---

## 3. Core rules

1. **One login** at `/` — role resolved from Unique Id (admin / faculty / student tables).
2. Students must **complete biodata** before creating or joining a group.
3. Groups: **max 5 members**, same batch; rolls must already be registered.
4. Group status: `forming` → `pending_admin` → `active` (or `rejected`).
5. Leader invites by search; invitee **approves/rejects**; then admin approves.
6. Admin assigns **one primary mentor** per active group.
7. Weekly diary: Weeks **1–8** on `/group/[id]`.
8. Rubrics: fixed **R1–R8**; students & mentors see only **unlocked** ones (timeline); admin sees all.
9. R2 and R6 expect **slides + report** file uploads.
10. Forms return **ActionResult** (`ok` / `fail`) with UI banners — no silent failures on key flows.

---

## 4. End-to-end flow

```text
Admin registers users / CSV import
        ↓
Admin sets R1–R8 open + due timeline
        ↓
Student biodata → create group OR accept invite
        ↓
Leader finishes invites → pending_admin
        ↓
Admin approves + assigns mentor
        ↓
Weekly diary (students write, faculty evaluate)
        ↓
Rubrics unlock by date → score / upload (R2, R6)
        ↓
Admin Marks sheet / CSV download
```

---

## 5. Rubrics

| Code | Title | Max | Files |
|------|-------|-----|-------|
| R1 | Project Proposal / Problem Analysis | 18 | — |
| R2 | Synopsis Presentation | 24 | slides + report |
| R3 | Teamwork & Progress | 12 | — |
| R4 | Design Methodology | 50 | — |
| R5 | Mid-term Incorporation | 50 | — |
| R6 | Implementation Presentation | 30 | slides + report |
| R7 | Research Paper | 35 | — |
| R8 | Final Teamwork & Presentation | 30 | — |

### Timeline unlock

- Admin sets **Open** and **Due** datetime for each code at `/admin/dates` (per batch).
- A rubric becomes visible to **students and faculty** when `openAt <= now`.
- Future rubrics stay **hidden** until their open time.
- **Admin** always sees the full R1–R8 catalog and can score any rubric.
- Tip: set each next **Open** after the previous **Due** so they appear one by one.
- Past unlocked rubrics stay visible so scores and uploads remain available.
- Server actions reject evaluate/upload on locked rubrics for non-admin roles.

Definitions: `src/lib/map/rubrics.ts` (`visibleRubricCodes`, `nextLockedRubric`).

---

## 6. Data model (Prisma)

| Model | Purpose |
|-------|---------|
| `Batch` | e.g. 2023–2027 / 2021–2025 |
| `Admin` / `Faculty` / `Student` | Unique Id + password hash; student biodata fields |
| `ProjectGroup` | Code, title, summary fields, status, batch |
| `GroupInvite` | Pending / accepted / rejected invites by AKTU roll |
| `GroupMentor` | Faculty ↔ group assignment |
| `WeeklyEntry` | Week 1–8 summary + performance |
| `RubricDeadline` | `openAt` + `dueAt` per batch × rubric |
| `RubricGroupStatus` | Completed flag, examiner, slides/report paths |
| `RubricStudentMark` | Per-student marks per rubric |
| `ActivityLog` | Audit trail |

Schema: `prisma/schema.prisma` · Seed: `prisma/seed.ts` · Faculty names: `prisma/data/map-faculty.json`

### Seed snapshot

- Batches: `2023-2027` (active), `2021-2025`
- 2 admins, **16 faculty** (UIT-MAP mentor list), **100 students**
- Students `…0001`–`…0049`: biodata complete; `…0050`–`…0100`: biodata incomplete
- **10 premade active groups** (`GRP-2027-001`–`010`), 3 members each, each assigned a UIT-MAP mentor; week-1 diary sample filled
- Default R1–R8 windows: sequential 14-day opens (R1 open immediately)

---

## 7. Auth & passwords

| Action | Where |
|--------|--------|
| Login | `/` — Unique Id + password |
| Change password | Nav **Password** → `/account/password` |
| Forgot password | `/forgot-password` — Unique Id + registered email + new password |
| Admin reset | Students / Faculty list — set temp password |

Passwords hashed with **bcrypt**. Session via **Auth.js** (`src/auth.ts`). Middleware protects role prefixes and `/students/*` (admin/faculty only).

---

## 8. Validation & UX

- Server actions in `src/lib/map/actions.ts` return `ActionResult` (`src/lib/map/result.ts`).
- Client wrapper: `src/components/action-form.tsx` + alert banners.
- Used for biodata, invites, group submit, weekly save, rubrics, import, passwords, timeline save, uploads.

---

## 9. File uploads

- Rubrics **R2** and **R6**: slides + report.
- Stored under `public/uploads/groups/{groupId}/{rubricCode}/` (gitignored contents).
- Allowed: PDF, PPT/PPTX, DOC/DOCX, PNG, JPG · max 8 MB.
- UI: `src/components/rubric-files.tsx`.

---

## 10. CSV student import

- Route: `/admin/import`
- Columns: `uniqueId,fullName,email,phone` (header optional)
- Invalid rolls / duplicates skipped; new accounts get default password and must complete biodata.

---

## 11. Student biodata for staff

- Faculty and admin click a **student name** anywhere it is linked → `/students/[id]`.
- Shows profile fields, batch, group membership, short bio.
- Faculty may open students in **their mentored groups** only; admin may open any student.
- Component: `src/components/student-name-link.tsx`.

---

## 12. Project structure

```text
prisma/
  schema.prisma
  seed.ts
  data/map-faculty.json
src/
  app/
    page.tsx                 # login
    forgot-password/
    account/password/
    guidelines/
    student/                 # home + rubrics
    faculty/                 # home + rubrics
    admin/                   # home, groups, dates, rubrics, marks, students, import, faculty
    group/[id]/               # single group page
    students/[id]/            # biodata (staff)
    api/auth/                # NextAuth
  components/                # UI, ActionForm, RubricPanel, uploads, forms
  lib/
    map/actions.ts           # server actions
    map/rubrics.ts           # R1–R8 + timeline helpers
    map/result.ts            # ActionResult
    map/session.ts           # requireRole
    auth helpers, constants, prisma
  auth.ts
  middleware.ts
public/
  brand/
  uploads/                   # runtime uploads (groups/ gitignored)
```

---

## 13. Local development

```bash
npm install
npm run db:reset    # wipe + seed
npm run dev         # http://localhost:3000
```

Demo credentials: see [README.md](./README.md).

### Windows note

If `prisma generate` / `db:reset` fails with file locks (`EPERM` on the query engine), stop the Next.js/`node` process first, then retry.

---

## 14. Changelog (product evolution)

| Area | What shipped |
|------|----------------|
| MAP rewrite | Simplified IA; Unique Id login; biodata; group invite/approve; single group page |
| Faculty data | 16 mentors copied from UIT-MAP names into seed JSON |
| Validation | ActionResult + form banners across key flows |
| Import | Admin bulk CSV students |
| Uploads | R2/R6 slides & report |
| Passwords | Change, forgot, admin reset |
| Biodata links | Faculty/admin open `/students/[id]` from names |
| Rubric timeline | `openAt`/`dueAt`; progressive unlock for students & mentors; admin sees all |

---

## 15. Out of scope / later ideas

- Email delivery for invites / password reset tokens (forgot currently verifies registered email in-app)
- Cloud object storage for uploads
- PostgreSQL production datasource (swap `DATABASE_URL`)
- Mobile / REST clients beyond `/api/me` and `/api/health`
