# UIT - SPAM — Project Documentation

**United Institute Of Technology - Student Project Assessment And Mentorship**  
Short name: **UIT - SPAM**  
Stack: **Next.js · TypeScript · Prisma · Auth.js · Tailwind**  
Version: `2.0.0`

---

## 1. Vision

UIT - SPAM is a college-scale platform for final-year project submission, mentoring, progress tracking, and contribution-based assessment at United Institute Of Technology.

Three separate login portals:

| Role | Portal path | Landing |
|------|-------------|---------|
| Student | `/login/student` | Project creation workspace |
| Faculty | `/login/faculty` | Monitoring & assessment dashboard |
| Admin (Principal) | `/login/admin` | Campus command center + mentor assignment |

---

## 2. Domain mapping

```
Admin assigns Faculty ──► Project Group ◄── Students (1 group each)
                              │
                              ▼
                           Project
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
              Progress   Assessments  Comments
```

Rules:
1. Student → one group  
2. Faculty → many groups  
3. Mentor assignment is **admin-only**  
4. Groups start temporary (`isTemporary`) until activated  

---

## 3. Tech architecture

```
src/
  app/                 App Router pages + API routes
    login/             Role-specific logins
    student/           Student portal
    faculty/           Faculty portal
    admin/             Admin portal
    api/               health, me, auth
  components/          Shared UI shell + brand components
  lib/                 Prisma, constants, server actions
  auth.ts              Auth.js config
  middleware.ts        Role route protection
prisma/
  schema.prisma
  seed.ts
legacy-php/            Previous PHP prototype (reference)
```

### Production scale path

| Concern | Now | Later |
|---------|-----|-------|
| DB | SQLite file | PostgreSQL (`DATABASE_URL`) |
| Auth | Auth.js credentials / JWT session | JWT bearer for Android |
| API | `/api/health`, `/api/me` | Versioned REST `/api/v1/*` |
| Mobile | — | Flutter / React Native on same API |
| Hosting | `next start` | Vercel / Node + managed Postgres |

---

## 4. Brand UI

Product brand: **UIT - SPAM**  
Institution logo: United Group of Institutions (`public/brand/united-logo.png`)

Brand colors (from official logo):

- Primary blue `#334D93` / deep `#243771`
- Accent red `#D62027`
- Soft blue `#D9E1F5`
- Fonts: **Fraunces** (display) + **Sora** (UI)

---

## 5. Demo credentials

Password for all: `password123`

| Role | Username |
|------|----------|
| Admin | `principal` |
| Faculty | `faculty1`, `faculty2`, `faculty3` |
| Student | `stu_lead1`, `stu_mem1`, `stu_lead2`, `stu_lead3`, … |

GRP-2026-003 remains temporary/pending until admin assigns a mentor.

---

## 6. Run locally

```bash
npm install
npm run db:reset
npm run dev
```

App: http://localhost:3000  
Health: http://localhost:3000/api/health

---

## 7. Feature checklist

### Student
- Project create/update/submit
- Milestone checklist + campus deadlines
- Submission vault with versions + similarity hint
- Progress timeline + mentor comments
- Contribution log
- Peer ratings
- Meetings & attendance view
- Marks (assessments, rubric, viva)
- Team change requests
- Announcements + notifications

### Faculty
- Dashboard + review queue
- Multi-group mentoring / compare heatmap
- Rubric marking + viva scoring
- Quick assessments + comments + templates
- Meetings with attendance
- Escalation flags
- Approve/reject team change requests

### Admin
- Overview KPIs + activity trail
- Groups / faculty / students CRUD
- Mentor assignment + load balancer
- Deadline calendar + announcements
- Escalation resolution
- Policy locks (submissions / marks)
- CSV bulk import + exam-cell export
- Campus reports + notifications
