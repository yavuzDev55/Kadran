# KADRAN — Academic Time & Task Management Panel

KADRAN is a minimalist, desktop-first calendar and task manager built for
university students. It replaces generic calendar apps with a model
tailored to academic life: courses, exams, homework, and free-form
personal tasks, each with their own sense of time.

---

## Why KADRAN

General-purpose calendars (Google Calendar, Outlook, Apple Calendar) add
friction for a student's actual workload:

- High input cost for simple recurring class schedules
- No concept of "deadline" vs. "exact time" vs. "no time at all"
- No per-task completion tracking for individual occurrences of a
  recurring item
- Generic categorization that doesn't map to academic task types

KADRAN is built around four task types (Course, Exam, Homework, Custom)
and five time models that cover everything from a fixed lecture slot to
a task with no date at all.

**Design note:** KADRAN intentionally does **not** detect or block
schedule conflicts. Two tasks can occupy the same time slot; the
calendar simply renders both. This is a deliberate product decision,
not a missing feature.

---

## Tech Stack

### Backend

- **Node.js** (ES Modules, JavaScript — not TypeScript)
- **Express 4** — REST API
- **Prisma 5** — ORM and migrations
- **PostgreSQL** — database (Neon or any standard Postgres instance)
- **JWT + bcryptjs** — authentication
- Feature-based folder structure: each domain owns its
  `router / controller / service / db / validator` files

### Frontend

- **React 19** + **Vite**
- **Tailwind CSS**
- **React Router** — client-side routing
- **Axios** — API client
- **react-hot-toast** — non-blocking notifications

### Ports (development)

| Service  | Port |
|----------|------|
| Backend  | 3000 |
| Frontend | 5173 |

---

## Project Structure