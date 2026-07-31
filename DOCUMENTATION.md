# UIT - SPAM Documentation

MAP-aligned portal for United Institute Of Technology final-year projects.

## Roles

| Role | Login | Main screens |
|------|-------|----------------|
| Student | Unique Id = AKTU roll | Biodata → create/join group → `/group/[id]` |
| Faculty | Unique Id | My groups → `/group/[id]` (evaluate weeks + R1–R8) |
| Admin | Unique Id | Home tiles: Groups, Dates, Marks, Students, Faculty, Guidelines |

## Core rules

1. One login page (`/`) — role detected from Unique Id.
2. Students must complete biodata before creating/joining a group.
3. Groups: 1–5 members, same batch, AKTU rolls must already be registered.
4. Weekly diary: Week 1–8 on the group page.
5. Rubrics: fixed R1–R8 with per-student marks on the same page.
6. Admin assigns mentors and downloads the marksheet.

## Local setup

```bash
npm install
npm run db:reset
npm run dev
```

Demo accounts are listed in `README.md`.
