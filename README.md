# KADRAN — Academic Task & Calendar Management API

> A focused REST API backend for university students to manage lectures, exams, assignments, and personal tasks in one place.

---

## Overview

University students deal with multiple courses, overlapping deadlines, recurring lectures, and exam schedules simultaneously. Most general-purpose calendar apps are either too complex or not designed for this specific workflow.

KADRAN provides a clean, structured backend API that models the academic calendar naturally — distinguishing between a lecture (recurring, hourly), an exam (one-time, high priority), an assignment deadline (all-day), and a personal task — and exposing all of this through a consistent REST API.

---

## Features

- **JWT Authentication** — register, login, 7-day tokens
- **Four Task Types** — `DERS` (lecture), `SINAV` (exam), `ODEV` (assignment), `KISISEL` (personal)
- **Three Time Models** — `HOURLY` (start/end time), `ALLDAY` (deadline), `REMINDER` (single time point)
- **Recurring Tasks** — daily, weekly (specific days), or monthly (specific day or last day), with optional end date
- **Category System** — user-defined categories with hex color codes
- **Tag System** — flexible N:N tagging, tags created automatically on first use
- **Filtering** — filter tasks by date range, category type, priority, tags, and completion status
- **Pagination** — limit/offset on task listing
- **Ownership Enforcement** — users can only access and modify their own data
- **Structured Error Responses** — consistent JSON error format across all endpoints

---

## Tech Stack

| | |
|---|---|
| Runtime | Node.js 18+ (ES Modules) |
| Framework | Express.js |
| Database | PostgreSQL (hosted on [Neon](https://neon.tech)) |
| ORM | Prisma |
| Authentication | JWT + bcryptjs |
| Language | JavaScript |

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A PostgreSQL database (Neon free tier works)

### Installation

```bash
git clone https://github.com/your-username/kadran-backend.git
cd kadran-backend
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```env
DATABASE_URL="postgresql://user:password@host/dbname"
JWT_SECRET="your-random-secret-key"
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

### Database Setup

```bash
npx prisma migrate dev --name init
```

### Run

```bash
npm run dev
```

The server starts at `http://localhost:3000`. Check `GET /health` to confirm it's running.

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create a new account |
| POST | `/auth/login` | Login and receive a JWT token |

All other endpoints require the `Authorization: Bearer <token>` header.

---

### Categories

| Method | Endpoint | Description |
|---|---|---|
| GET | `/categories` | List all categories |
| POST | `/categories` | Create a category |
| PATCH | `/categories/:id` | Update a category |
| DELETE | `/categories/:id` | Delete a category (cascades to tasks) |

**Create body:**
```json
{
  "name": "Mathematics",
  "color": "#0066FF"
}
```

---

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| GET | `/tasks` | List tasks (with filters) |
| POST | `/tasks` | Create a task |
| PATCH | `/tasks/:id` | Update any task field (partial) |
| DELETE | `/tasks/:id` | Delete a task |
| PATCH | `/tasks/:id/toggle` | Toggle completion status |
| POST | `/tasks/:id/tags` | Add tags to a task |
| DELETE | `/tasks/:id/tags/:tagId` | Remove a tag from a task |

**GET /tasks query parameters:**

| Param | Type | Example | Description |
|---|---|---|---|
| `from` | date | `2024-01-01` | Start of date range |
| `to` | date | `2024-02-01` | End of date range |
| `category` | string | `DERS` | Filter by task type |
| `priority` | string | `HIGH` | Filter by priority |
| `tags` | string | `library,urgent` | Comma-separated tag names |
| `showCompleted` | boolean | `false` | Include completed tasks |
| `limit` | number | `20` | Results per page (max 100) |
| `offset` | number | `0` | Pagination offset |

**Create task body — HOURLY example:**
```json
{
  "title": "Mathematics Lecture",
  "type": "DERS",
  "categoryId": 1,
  "timeType": "HOURLY",
  "date": "2024-01-15",
  "startTime": "09:00",
  "endTime": "11:00",
  "priority": "MEDIUM",
  "tags": ["lecture", "compulsory"]
}
```

**Create task body — Recurring WEEKLY example:**
```json
{
  "title": "Mathematics Lecture",
  "type": "DERS",
  "categoryId": 1,
  "timeType": "HOURLY",
  "date": "2024-01-15",
  "startTime": "09:00",
  "endTime": "11:00",
  "priority": "MEDIUM",
  "isRecurring": true,
  "recurrencePattern": "WEEKLY",
  "recurrenceDays": "MON,WED,FRI",
  "recurrenceStart": "2024-01-15",
  "recurrenceEnd": "2024-04-15"
}
```

**Create task body — ALLDAY (assignment deadline) example:**
```json
{
  "title": "Statistics Assignment Due",
  "type": "ODEV",
  "categoryId": 2,
  "timeType": "ALLDAY",
  "date": "2024-01-25",
  "priority": "HIGH"
}
```

**Create task body — REMINDER example:**
```json
{
  "title": "Final Exam Reminder",
  "type": "SINAV",
  "categoryId": 1,
  "timeType": "REMINDER",
  "date": "2024-02-20",
  "reminderTime": "08:00",
  "priority": "HIGH"
}
```

**Add tags body:**
```json
{
  "tagNames": ["library", "group-study"]
}
```

---

### Tags

| Method | Endpoint | Description |
|---|---|---|
| GET | `/tags` | List all tags |
| DELETE | `/tags/:id` | Delete a tag |

---

### Error Response Format

All errors return a consistent structure:

```json
{
  "success": false,
  "error": {
    "name": "ValidationError",
    "message": "Task validation failed",
    "details": {
      "errors": [
        "startTime is required for HOURLY tasks",
        "startTime must be before endTime"
      ]
    }
  }
}
```

| Status | Error Name | When |
|---|---|---|
| 400 | `ValidationError` | Missing or invalid input |
| 401 | `AuthenticationError` | Missing or invalid token |
| 403 | `AuthorizationError` | Accessing another user's data |
| 404 | `NotFoundError` | Record not found |
| 409 | `ConflictError` | Duplicate email, category name, etc. |
| 500 | `InternalServerError` | Unexpected server error |

---

## Data Models

### Task Types

| Value | Meaning |
|---|---|
| `DERS` | Lecture / class session |
| `SINAV` | Exam or quiz |
| `ODEV` | Assignment or project deadline |
| `KISISEL` | Personal task |

### Time Types

| Value | Required Fields | Use Case |
|---|---|---|
| `HOURLY` | `startTime`, `endTime` | Lectures, exams, meetings |
| `ALLDAY` | none | Assignment deadlines, all-day events |
| `REMINDER` | `reminderTime` | Reminders, alerts |

### Recurrence Patterns

| Value | Additional Fields | Example |
|---|---|---|
| `DAILY` | — | Daily standup |
| `WEEKLY` | `recurrenceDays` (e.g. `"MON,WED,FRI"`) | Weekly lectures |
| `MONTHLY` | `recurrenceDay` (1–31 or -1 for last day) | Monthly payment reminder |

Setting `recurrenceEnd` to `null` creates an infinite recurring task.

---

## Project Structure

```
src/
├── server.js                    # Express app, route mounting
├── config/
│   └── database.js              # Singleton Prisma client
├── shared/
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   └── errorHandler.middleware.js
│   └── utils/
│       └── customErrors.js
└── features/
    ├── auth/                    # register, login
    ├── category/                # CRUD
    ├── tag/                     # list, delete
    ├── task/                    # full CRUD + toggle + tag management
    └── recurring/               # instance generation algorithm
```

Each feature follows the same pattern:

```
router → validator → controller → service → db
```

- **validator** — Express middleware, validates request data before it reaches the controller
- **controller** — thin layer, calls service and sends response
- **service** — business logic and ownership checks
- **db** — only Prisma queries

---

## Recurring Task Design

Recurring tasks are stored as a **single database row** containing the pattern (e.g. "every Monday, Wednesday, Friday from Jan 15 to Apr 15"). The individual occurrences (instances) are generated on the **frontend** using the `generateInstances()` function from `recurring.service.js`.

This approach keeps the database clean while allowing flexible display logic on the client side.

---

## Security

- Passwords are hashed with bcrypt (10 salt rounds)
- JWT tokens expire after 7 days
- All protected routes verify token via middleware
- Every service checks that the requesting user owns the target resource
- Error messages in production do not expose internal details

---

## Roadmap

- [ ] Frontend — Vanilla JS calendar UI
- [ ] Conflict detection (overlapping HOURLY tasks)
- [ ] Email / push notifications for upcoming deadlines
- [ ] Password reset flow
- [ ] Rate limiting
- [ ] Seed file for development data
- [ ] Pagination on categories and tags endpoints

---

## License

MIT
