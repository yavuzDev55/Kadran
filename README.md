# KADRAN — Academic Time & Task Management Panel

KADRAN is a minimalist, desktop-first calendar and task manager built for
university students. Instead of a generic calendar, it models academic life
directly: courses, exams, homework, and free-form tasks, each with its own
sense of time.

---

## Features

- **Dashboard (home page)** — five panels on one screen:
  - **Active Now** — the task running right now, with a progress bar and remaining time
  - **Today / Next 7 Days** — tabbed agenda; the weekly tab expands recurring tasks and groups them by day
  - **High Priority** — unfinished `HIGH` tasks for the next 14 days, plus undated ones
  - **Anytime Tasks** — tasks with no date and no time
  - **Search** — find tasks by name and/or task type
- **Calendar** — week and month views with a configurable hour range
- **List view** — filter by type, priority, tag, and date range
- **Five time models** — see [Time models](#time-models)
- **Recurring tasks** — daily, weekly (chosen weekdays), or monthly (a day of the month or the last day), with an optional end date
- **Per-occurrence completion** — completing one lecture does not complete the whole series
- **Flexible weekly schedule** — one task with a different time slot per weekday
- **Tags, custom colors, pinning, completability** per task
- **User preferences** — week start, calendar hours, 12/24-hour clock, default view, hide completed, timezone

**Design note:** KADRAN intentionally does **not** detect or block schedule
conflicts. Two tasks can occupy the same slot and the calendar renders both.
This is a product decision, not a missing feature.

---

## Tech stack

| Layer    | Technology |
|----------|------------|
| Backend  | Node.js (ES modules, plain JavaScript), Express 4, Prisma 5, PostgreSQL, JWT + bcryptjs |
| Frontend | React 19, Vite, Tailwind CSS 3, React Router 7, Axios, react-hot-toast |

Development ports: backend **3000**, frontend **5173**.

---

## Project structure

```
Kadran/
├── kadran-backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── server.js
│       ├── config/                 # database, colors, limits
│       ├── shared/
│       │   ├── middlewares/        # auth, error handler
│       │   └── utils/              # custom errors, date helpers
│       └── features/               # one folder per domain
│           ├── auth/               # router · controller · service · db · validator
│           ├── task/
│           ├── tag/
│           ├── recurring/          # occurrence generation
│           └── meta/               # color palette
│
└── kadran-frontend/
    └── src/
        ├── App.jsx                 # routes
        ├── context/AuthContext.jsx
        ├── services/api.js         # axios instance + auth interceptor
        ├── pages/                  # Dashboard, Tasks, TaskCreate, Calendar, Settings, Login, Register
        ├── components/             # dashboard panels, calendar views, modals, dialogs
        └── utils/                  # calendarUtils, dashboardUtils, formatTime
```

---

## Getting started

### Prerequisites

- Node.js 20.19 or newer (required by Vite)
- A PostgreSQL database (local, or hosted such as Neon)

### 1. Backend

```bash
cd kadran-backend
npm install
cp .env.example .env        # then edit the values, see below
npx prisma migrate dev      # creates the schema
npm run dev                 # http://localhost:3000
```

Environment variables (`kadran-backend/.env`):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | **Required.** The server refuses to start without it |
| `PORT` | Defaults to `3000` |
| `FRONTEND_URL` | Allowed CORS origin. Use `http://localhost:5173` in development |
| `MAX_TIMED_HOURS_WARNING` | Warn when a `TIMED` task is longer than this many hours (default `24`) |
| `MAX_RANGE_DAYS_WARNING` | Warn when a `DATE_RANGE` task is longer than this many days (default `30`) |
| `MAX_RANGE_DAYS_HARD` | Reject a `DATE_RANGE` task longer than this many days (default `365`) |

> `.env.example` currently lists `FRONTEND_URL` as port 3000. The Vite dev
> server runs on **5173**, so set it to `http://localhost:5173` or the browser
> will block API requests.

Other scripts: `npm start`, `npm run prisma:studio`, `npm run db:reset`.

### 2. Frontend

```bash
cd kadran-frontend
npm install
npm run dev                 # http://localhost:5173
```

The API base URL defaults to `http://localhost:3000`. To change it, create
`kadran-frontend/.env` with `VITE_API_URL=https://your-api-host`.

Other scripts: `npm run build`, `npm run preview`, `npm run lint`.

### 3. First run

Open `http://localhost:5173`, register an account, and create a task with
**+ New Task**. The dashboard fills in as soon as tasks exist.

---

## Frontend routes

| Path | Page | Login required |
|------|------|----------------|
| `/` | Dashboard | yes |
| `/tasks` | List view with filters | yes |
| `/tasks/new` | Create task | yes |
| `/tasks/edit/:id` | Edit task | yes |
| `/calendar` | Week / month calendar | yes |
| `/settings` | User preferences | yes |
| `/login`, `/register` | Authentication | no |

---

## Data model

Task types: `COURSE`, `EXAM`, `HOMEWORK`, `CUSTOM`.
Priorities: `LOW`, `MEDIUM`, `HIGH`.

### Time models

| `timeType` | Fields used | Example |
|------------|-------------|---------|
| `TIMED` | `date`, `startTime`, `endTime` | Lecture, Monday 09:00–11:00 |
| `TIMED_OPEN` | `date`, `startTime` | Study session from 14:00, no fixed end |
| `DEADLINE` | `date` | Assignment due on a given day |
| `DATE_RANGE` | `rangeStartDate`, `rangeEndDate` (+ optional times) | Project running over two weeks |
| `ANYTIME` | none | "Read chapter 4" — no date, no time |

### Recurrence

`isRecurring` with a `recurrencePattern` of `DAILY`, `WEEKLY`
(`recurrenceDays`, e.g. `MONDAY,WEDNESDAY`) or `MONTHLY` (`recurrenceDay`,
`1`–`31`, or `-1` for the last day). The database stores **one row per series**;
individual dates are generated on demand by
`kadran-backend/src/features/recurring/recurring.service.js`.
`kadran-frontend/src/utils/calendarUtils.js` mirrors that logic, so keep the two
in sync when changing recurrence rules.

Completing a recurring task writes a `TaskCompletion` row for that date only.
Non-recurring tasks use the plain `isCompleted` flag.

### Other task fields

- `isCompletable` — defaults to `false` for `COURSE`, `true` otherwise
- `color` — optional, must come from the palette (`GET /meta/colors`); falls back to the type color
- `isPinned` — pinned tasks appear in the dashboard's Today tab regardless of date
- `isFlexibleSchedule` + `schedules` — a different time slot per weekday

---

## API overview

Responses use the envelope `{ success, data, meta? }`. Errors return
`{ success: false, error: { name, message, details? } }`. Every route except
`/auth/register`, `/auth/login`, `/health` and `/meta/colors` needs an
`Authorization: Bearer <token>` header.

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/auth/register`, `/auth/login` | Create account / sign in |
| GET, PATCH, DELETE | `/auth/me` | Read / update preferences / delete account |
| PATCH | `/auth/me/password` | Change password |
| GET | `/tasks` | List tasks |
| GET | `/tasks/:id` | Single task |
| POST | `/tasks` | Create task |
| PATCH | `/tasks/:id` | Update task |
| DELETE | `/tasks/:id` | Delete task |
| PATCH | `/tasks/:id/toggle` | Toggle completion; body `{ "date": "YYYY-MM-DD" }` is required for recurring tasks |
| POST | `/tasks/:id/tags` | Add a tag by name |
| DELETE | `/tasks/:id/tags/:tagId` | Remove a tag |
| GET, DELETE | `/tags`, `/tags/:id` | List / delete tags |
| GET | `/meta/colors` | Color palette and per-type defaults |
| GET | `/health` | Health check |

`GET /tasks` query parameters: `q` (case-insensitive title search), `type`,
`priority`, `tags` (comma-separated), `from`, `to`, `showCompleted`, `limit`
(default 50), `offset`.

> `from` / `to` match a task's own `date` or `rangeStartDate` only. A recurring
> series is stored with its first date, so the calendar and dashboard fetch
> tasks without a date range and expand recurrences on the client.

---

## Security notes

- Passwords are hashed with bcrypt, and task routes check that the task belongs to the requesting user.
- The JWT is stored in `localStorage`, which is exposed to XSS. That is acceptable for this project; a production deployment should use `HttpOnly` cookies with refresh tokens.
- Never commit `.env`, and use a long random `JWT_SECRET`.

---

## Known limitations

- The dashboard and calendar load up to 100 tasks per request.
- A `DATE_RANGE` task is drawn on the calendar grid only on its start date.
- On the dashboard, a timed task that crosses midnight counts as active only until midnight.
- There is no seed script and no automated test suite yet.