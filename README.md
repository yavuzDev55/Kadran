# KADRAN — Academic Time & Task Management Panel

KADRAN is a minimalist, desktop-first calendar and task manager built for
university students. Instead of a generic calendar, it models academic life
directly: courses, exams, homework, and free-form tasks, each with its own
sense of time.

---

## Features

- **Dashboard (home page)** — top to bottom:
  - **Active now** — a slim strip for `TIMED` tasks running right now and `MULTI_DAY` tasks whose range contains today (progress and time left); when nothing is active it shows the next task of the day
  - **Today / Next 7 days** — tabbed agenda
  - **High priority** and **Pinned** — at most five rows each, with a link to the filtered list
  - **Any time** — every task without a date or time, in a scrollable box with search and a full-list dialog
- **Calendar** — week and month views; multi-day tasks are bars across the days, open-ended tasks and deadlines are small labels at their clock time; filters live in a left sidebar
- **List view** — left filter sidebar (search, type, time type, priority, tags, date range, completed, pinned); a recurring series is one row that expands into its occurrences
- **Five time models** — see [Time models](#time-models)
- **Task-type rules** — course, homework, exam and custom tasks each allow different time models, recurrence and defaults, see [Task types](#task-types)
- **Recurring tasks** — daily, weekly (chosen weekdays, each with its own time), or monthly (a day of the month or the last day). The end date is required and at most one year after the start. Every occurrence is a real task with its own completion, edit and delete
- **Pinned tasks** — pin any task from the task form, the dashboard, the list view, or the calendar detail window; pinning a series pins every occurrence
- **Tags** — added through a search box that suggests existing tags while you type; custom colors and completability per task
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
│           ├── task/               # + task.rules.js (type rules), task.time.js (time models)
│           ├── tag/
│           ├── recurring/          # series: occurrence generation, /series routes
│           └── meta/               # color palette
│
└── kadran-frontend/
    └── src/
        ├── App.jsx                 # routes
        ├── context/AuthContext.jsx
        ├── services/api.js         # axios instance + auth interceptor
        ├── pages/                  # Dashboard, Tasks, TaskCreate, Calendar, Settings, Login, Register
        ├── components/             # dashboard panels, calendar views, modals, dialogs
        └── utils/                  # dateUtils, calendarUtils, dashboardUtils, formatTime, taskRules, filters
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
| `MAX_RANGE_DAYS_WARNING` | Warn when a `MULTI_DAY` task is longer than this many days (default `30`) |
| `MAX_RANGE_DAYS_HARD` | Reject a `MULTI_DAY` task longer than this many days (default `365`) |
| `MAX_LIST_LIMIT` | Largest page `GET /tasks` returns (default `500`) |

Other scripts: `npm test` (backend tests, no database needed), `npm start`, `npm run prisma:studio`, `npm run db:reset`.

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
| `/tasks/edit/:id` | Edit a task, or one occurrence of a series | yes |
| `/tasks/edit/:id?scope=series` | Edit the fields shared by a whole series | yes |
| `/calendar` | Week / month calendar | yes |
| `/settings` | User preferences | yes |
| `/login`, `/register` | Authentication | no |

---

## Data model

Task types: `COURSE`, `EXAM`, `HOMEWORK`, `CUSTOM`.
Priorities: `LOW`, `MEDIUM`, `HIGH`.

### Task types

| Type | Allowed time models | Recurrence | Defaults |
|------|--------------------|------------|----------|
| `COURSE` | `TIMED` | yes | completable optional (on) |
| `HOMEWORK` | `DEADLINE` | no | completable always on |
| `EXAM` | `TIMED` | no | priority `HIGH`, completable optional (off) |
| `CUSTOM` | any | `TIMED` / `OPEN_ENDED` only | completable optional (on) |

The rules live in `kadran-backend/src/features/task/task.rules.js`; the frontend keeps a mirror in
`kadran-frontend/src/utils/taskRules.js`. Keep both in sync.

### Time models

| `timeType` | Fields used | Example | On the calendar |
|------------|-------------|---------|-----------------|
| `TIMED` | `date`, `startTime`, `endTime` | Lecture, Monday 09:00–11:00 | block over its duration |
| `OPEN_ENDED` | `date`, `startTime` | Study session from 14:00, no fixed end | small label at the start time |
| `MULTI_DAY` | `rangeStartDate`, `rangeEndDate` (whole days; the same day twice = one-day task) | Project over two weeks | bar across the days (all-day item for one day) |
| `ANY_TIME` | none | "Read chapter 4" | not shown |
| `DEADLINE` | `date`, `endTime` (due time, default `23:59`) | Assignment due Friday 17:00 | small label at the due time |

### Recurrence

A recurring task is a `TaskSeries` (the rule: pattern, start and end date, weekdays or day of month)
plus **one real task per occurrence** (`Task.seriesId`). The occurrences are generated once, when the
task is created (`kadran-backend/src/features/recurring/recurring.service.js`).

- `recurrence`: `{ pattern: DAILY | WEEKLY | MONTHLY, startDate, endDate, weekDays?, monthDay?, slots? }`
- `endDate` is required and at most one year after `startDate`
- `WEEKLY` takes `weekDays` and optional per-weekday clock times in `slots`; `MONTHLY` takes `monthDay`
  `1`–`31` (clamped to short months) or `-1` for the last day
- Only `TIMED` and `OPEN_ENDED` tasks of a type that allows recurrence can repeat
- Each occurrence has its own completion and delete. Only its day and time can be edited; the
  shared fields (title, priority, color, ...) are edited on the series (`PATCH /series/:id`)
- Pinning is applied to the whole series

### Other task fields

- `isCompletable` — default and whether it can be changed depend on the task type (see [Task types](#task-types))
- `color` — optional, must come from the palette (`GET /meta/colors`); falls back to the type color
- `isPinned` — pinned tasks are listed in the dashboard's Pinned panel regardless of date. A pinned
  series is listed once, as its next unfinished occurrence. Set it in the task form, or toggle it with
  the 📌 button on the dashboard, in the list view and in the calendar's task detail window

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
| PATCH | `/tasks/:id` | Update task; partial bodies are accepted (e.g. `{ "isPinned": true }`). For one occurrence of a series only `date`, `startTime`, `endTime` and `isPinned` are accepted |
| DELETE | `/tasks/:id` | Delete task (for a series: only that occurrence) |
| PATCH | `/tasks/:id/toggle` | Toggle completion |
| GET, PATCH, DELETE | `/series/:id` | Read a series with its occurrences / update the shared fields / delete the whole series |
| POST | `/series/:id/tags` | Add a tag to every occurrence |
| POST | `/tasks/:id/tags` | Add a tag by name |
| DELETE | `/tasks/:id/tags/:tagId` | Remove a tag |
| GET, DELETE | `/tags`, `/tags/:id` | List (`?filter=` text, `?limit=` up to 50) / delete tags |
| GET | `/meta/colors` | Color palette and per-type defaults |
| GET | `/health` | Health check |

`GET /tasks` query parameters: `q` (case-insensitive title search), `type`, `priority`, `timeType`,
`isPinned`, `tags` (comma-separated), `from`, `to`, `showCompleted` (shown unless set to `false`),
`collapseSeries` (one row per series, with `seriesInfo`), `today` (picks the occurrence that stands for
a series), `limit` (default 50, at most `MAX_LIST_LIMIT`), `offset`.

> `from` / `to` return single-day tasks whose `date` is inside the window and `MULTI_DAY` tasks whose
> range overlaps it. `ANY_TIME` tasks have no date and are never returned by a `from` / `to` query.

---

## Security notes

- Passwords are hashed with bcrypt, and task routes check that the task belongs to the requesting user.
- The JWT is stored in `localStorage`, which is exposed to XSS. That is acceptable for this project; a production deployment should use `HttpOnly` cookies with refresh tokens.
- Never commit `.env`, and use a long random `JWT_SECRET`.

---

## Known limitations

- The calendar loads up to 500 tasks per visible range.
- On the dashboard, a timed task that crosses midnight counts as active only until midnight.
- A series cannot change its type, time model or repeat rule after it is created; delete it and create a new one.
- A tag cannot be removed from a whole series, only from individual non-recurring tasks.
- There is no seed script. Backend tests (`npm test`) cover recurrence, task rules and validation; there are no frontend tests yet.